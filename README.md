# Weekend Planner AI Agent

An intelligent family weekend activity planner powered by Google Gemini 2.5 Flash and Google ADK (Agent Development Kit). This multi-agent system researches weather conditions and suggests personalized activities for families with children. This is Kaggle Capstone project for Nov 2025 AI Agents Intensive.

## Features

- **Weather-Aware Planning**: Checks weekend weather forecasts for your area
- **Smart Activity Routing**: Routes to outdoor or indoor activities based on weather
- **Personalized Recommendations**: Finds activities tailored to children's ages
- **Local Search Integration**: Uses Google Search to find real-time activities and events
- **Activity Categories**:
  - Local community activities
  - Special events (festivals, fairs, concerts)
  - Indoor at-home activities for bad weather

## Project Structure

```
WeekendPlanner/
├── __init__.py           # Package initialization
├── agent.py              # Main agent definitions and orchestration
```

## Installation

### Prerequisites
- Python 3.10+
- Google API credentials (for Gemini 2.5 Flash)
- Google ADK installed

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd WeekendPlanner
```

2. Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure Google ADK:
   - Set up your Google Cloud credentials
   - Configure the GOOGLE_API_KEY="your-key-here" environment variable
   -   run this comment "echo 'GOOGLE_API_KEY="your_api_key_here"' > .env"

## Usage

### Running the Agent

run this command "adk web"

## Frontend Application

#### Prerequisites
- Node.js 20.x LTS

#### Setup

```bash
cd frontend
npm install
npm run dev
```

#### Running Full Stack

Run both the backend and frontend in separate terminals:

**Terminal 1 (Backend):**
```bash
adk web
```
Backend runs at http://localhost:8000

**Terminal 2 (Frontend):**
```bash
cd frontend && npm run dev
```
Frontend runs at http://localhost:5173

### Agent Architecture

The system uses a multi-agent hierarchy:

0. **Input Parser**: Checks user input
1. **Weather Agent**: Checks weather conditions
2. **Weather Router**: Routes to appropriate activity planning based on weather
3. **Activity Research Group** (runs when weather is good):
   - Local Activities Agent: Finds nearby activities
   - Special Events Agent: Discovers festivals and events
4. **Home Activities Agent**: Suggests indoor activities when weather is poor
5. **Summarizer Agent**: Consolidates findings into recommendations

<img width="1166" height="281" alt="image" src="https://github.com/user-attachments/assets/ffb99c93-5deb-4170-bd32-609363e30fe6" />


## Configuration

Key agents use `gemini-2.5-flash` model. Customize by modifying:
- `model` parameter in agent definitions
- `instruction` prompts for different agent behaviors
- Tool selection (currently uses Google Search)

## Output

The system generates a concise, bulleted summary with:
- Area and weather information
- Child ages
- 3-5 key activity recommendations
- Disclaimer about AI-generated results

Sample output

<img width="689" height="359" alt="image" src="https://github.com/user-attachments/assets/e40ef150-2971-473c-ae3b-5fa124dd8d4e" />

<img width="679" height="397" alt="image" src="https://github.com/user-attachments/assets/82c96902-fbbb-41cc-b9b5-36b6fbd4758d" />

<img width="686" height="437" alt="image" src="https://github.com/user-attachments/assets/c58a1a5d-71ee-4321-bd9a-49ca7d4e72b8" />


## Support

For issues or questions, please open an issue on GitHub.
