from google.adk.agents import Agent, SequentialAgent
from google.adk.tools import google_search, AgentTool 


# --- 1. Define Configurations, Tools, and Backend ---
google_search_tool = google_search

# --- 2. Define Your Sub-Agents ---

preprocess_agent = Agent(
    name="PreprocessInputAgent",
    model="gemini-2.5-flash",
    instruction="""
You are a preprocessing agent. Your task is to extract clean, structured variables from the user's initial message.
You must extract:

1. zip_code: a valid US 5-digit zip code (e.g. 02138)
2. kid_ages: a list of integers between 1 and 18 (e.g. 4,7)

Extraction rules:
- If no valid zip code is found, set zip_code to "90120".
- If no valid ages are found, set kid_ages to "5,8".
- If a number appears >18 or <1, ignore it.
- Accept formats like: "kids are 3 and 7", "ages 4,5,11", "my son is 8", "2yo" → 2
- Output must ONLY be in this exact JSON form:
{
  "zip_code": "<5-digit>",
  "kid_ages": "4,7"
}

Do NOT add text, opinions, notes, or explanations.
""",
    output_key="parsed_input",
)

local_activities_agent = Agent(
    name="WeekendLocalActivityAgent",
    # We pass the model name as a string.
    model="gemini-2.5-flash",
    instruction="""You are a specialized family weekend planner. Given the weather is {weather_forecast}, use the google_search tool to find 3-4 possible activities for families with kids ages {parsed_input.kid_ages}} in zip code {parsed_input.zip_code} area.""",
    tools=[google_search_tool],
    output_key="local_activities_findings",
)

special_events_agent = Agent(
    name="WeekendSpecialActivityAgent",
    # We pass the model name as a string.
    model="gemini-2.5-flash",
    instruction="""You are a specialized family weekend planner. Given the weather is {weather_forecast}, use the google_search tool to find 3-4 special events for families with kids ages {parsed_input.kid_ages} in zip code {parsed_input.zip_code} area. Special events include festivals, fairs, concerts, or community gatherings.""",
    tools=[google_search_tool],
    output_key="special_activities_findings",
)



weather_agent = Agent(
    name="WeatherAgent",
    # We pass the model name as a string.
    model="gemini-2.5-flash",
    instruction="""You are weather checking agent. Your task is to check upcoming weekend weather in zip code {parsed_input.zip_code} area. Your output should be either "good", "bad" or "do not leave home" based on the weather forecast. Do NOT provide the forecast, explanations, or any other text.  """,
    tools=[google_search_tool],
    output_key="weather_forecast",
)


# Summarizer Agent: Its job is to summarize the text it receives.
summarizer_agent = Agent(
    name="SummarizerAgent",
    model="gemini-2.5-flash",
    instruction="""Read the provided research findings: 
**Weather Forecast:** {weather_forecast}
**Local Activities:** [[local_activities_findings]]
**Special Events:** [[special_activities_findings]]
**Home Activities:** [[home_activities_findings]]

Create a concise summary as a bulleted list with 3-5 key points. Only include suggestions for the research findings that were provided (i.e., if home activities were researched, ignore local and special events). Take the weather into consideration when making activity suggestions. Explain your choices to the user. Add friendly header - area, weather, ages. Add disclaimer - results are based on AI agent AI research and need to be verified for accuracy and availability.""",
    output_key="final_summary",
)

home_activities_agent = Agent(
    name="HomeActivitiesAgent",
    model="gemini-2.5-flash",
    instruction="""You are a family home activities planner. Use google_search to find 3-4 possible indoor, no-cost, at-home activities for families with kids ages {parsed_input.kid_ages}. Focus on creative, building, or simple science projects.""",
    tools=[google_search_tool],
    output_key="home_activities_findings",
)



# --- 2.5. Define Agent Groups (Flow Control Fix) ---

# 1. Research Group (Sequential) - NO CHANGE
research_group = SequentialAgent(
    name="ActivityResearchGroup",
    sub_agents=[local_activities_agent, special_events_agent],
)



weather_router_agent = Agent(
    name="WeatherRouter",
    model="gemini-2.5-flash", 
    instruction="""Based on the 'weather_forecast' ({weather_forecast}), determine the next step. 
    1. If the weather is 'do not leave home', you MUST call the 'home_activities_agent' tool.
    2. Otherwise, you MUST call the 'activity_research_group' tool.
    Output only the result of the tool call.""",
    
    # *** THE FIX: Revert to AgentTool ***
    tools=[
        AgentTool(home_activities_agent),  # Use AgentTool for agents
        AgentTool(research_group)          # Use AgentTool for agent groups
    ],
    output_key="final_research_data", 
)



root_agent = SequentialAgent(
    name="WeekendPlannerRootAgent",
    sub_agents=[
        preprocess_agent,
        weather_agent,
        weather_router_agent,
        summarizer_agent,
    ],
)

# --- 4. Expose the Root Agent to ADK ---
# The ADK CLI looks for a variable named 'agent' in this file.
agent = root_agent
