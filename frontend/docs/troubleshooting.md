# Troubleshooting Guide

Welcome to the Weekend Planner troubleshooting guide. If something isn't working quite right, don't worry — you're in the right place! This guide will help you solve the most common issues you might encounter while using the application.

> **Remember:** Most problems have simple solutions. Take a deep breath, and let's work through this together.

---

## Table of Contents

- [Connection Problems](#connection-problems)
- [Form Issues](#form-issues)
- [Loading and Results](#loading-and-results)
- [Server Errors](#server-errors)
- [Still Having Problems?](#still-having-problems)

---

## Connection Problems

### "Couldn't reach the backend" Error

**What you see:**
A message appears saying "Couldn't reach the backend. Make sure the ADK server is running with `adk web`."

**Why this happens:**
The Weekend Planner needs a backend server to process your requests and generate activity plans. This error means the backend server isn't running or can't be reached.

**How to fix it:**

1. Make sure the backend server is started before using the application
2. Ask your system administrator or the person who set up the application to start the backend server
3. The backend server should be running at `localhost:8000`
4. Once the server is running, try your request again

---

### "Connection blocked" or CORS Error

**What you see:**
A message mentioning "Connection blocked" or you see the application trying to load but nothing happens.

**Why this happens:**
Your web browser has security features that sometimes block connections between different parts of an application. This is normal browser behavior designed to keep you safe.

**How to fix it:**

1. This usually requires a technical setup change
2. Please refer to the main README file for instructions on proxy configuration
3. If you're not comfortable with technical setup, ask someone who set up the application for help
4. Once the configuration is correct, refresh the page and try again

---

## Form Issues

### Required Fields Not Filled

**What you see:**
The "Generate Plan" button stays disabled (grayed out) and you can't click it.

**Why this happens:**
Weekend Planner needs certain information to create your personalized plan. Without this information, it can't proceed.

**How to fix it:**

The following fields are **required** and must be filled out:

1. **Location** — Enter your city name or zip code
2. **Start Date** — Select when your weekend begins
3. **End Date** — Select when your weekend ends

Once all three fields have values, the Generate Plan button will become active and you can click it.

---

### "End date must be on or after start date" Error

**What you see:**
An error message appears near the date fields saying "End date must be on or after start date."

**Why this happens:**
This happens when you accidentally select an end date that comes before your start date. For example, if you select Friday as your start date but Thursday as your end date.

**How to fix it:**

1. Check your **Start Date** — this should be when your weekend begins
2. Check your **End Date** — this should be when your weekend ends
3. Make sure the end date is the same as or after the start date
4. For a typical weekend, your start date might be Friday or Saturday, and your end date might be Sunday or Monday

**Tip:** A single-day plan is perfectly fine! Just set both dates to the same day.

---

### Kids Ages Format Issues

**What you see:**
The application may not understand the ages you entered, or you're not sure how to enter multiple ages.

**Why this happens:**
The Kids Ages field expects ages in a specific format so the AI can understand and use them.

**How to fix it:**

The correct format is: **numbers separated by commas**

**Good examples:**
- `5` (one child, age 5)
- `3, 7` (two children, ages 3 and 7)
- `4, 8, 12` (three children, ages 4, 8, and 12)

**Things to avoid:**
- Don't write "years old" (just use the number)
- Don't use words like "three" (use "3" instead)
- Make sure to separate multiple ages with commas

**Remember:** This field is optional. If you leave it empty, the AI will suggest activities suitable for a general family audience.

---

## Loading and Results

### Request Timed Out

**What you see:**
After clicking "Generate Plan," you wait a long time and then see a message saying "Request timed out. Please try again."

**Why this happens:**
Creating your personalized weekend plan involves the AI searching for weather information, local activities, special events, and more. This usually takes about 10-20 seconds, but sometimes it can take longer. If it takes more than 30 seconds, the application stops waiting to prevent you from waiting indefinitely.

**How to fix it:**

1. **Try again** — Click the "Generate Plan" button once more. Sometimes the first attempt just needs a second chance.
2. **Check your internet connection** — Make sure you're connected to the internet.
3. **Simplify your request** — If you have a long preferences description, try shortening it.
4. **Wait a moment** — If you've made several requests quickly, wait about 30 seconds before trying again.

**Tip:** The AI is doing a lot of work behind the scenes — checking weather, searching for activities, and creating personalized recommendations. A little patience goes a long way!

---

### "Received an unexpected response format" Error

**What you see:**
A message appears saying "Received an unexpected response format" after you submit your request.

**Why this happens:**
Sometimes the response from the server doesn't look quite like what the application expected. This can happen due to temporary glitches.

**How to fix it:**

1. **Refresh the page** — Press the refresh button in your browser or press F5 on your keyboard
2. **Fill out the form again** and try generating a new plan
3. If the problem continues, wait a few minutes and try again

---

## Server Errors

### "Invalid request" or 400 Error

**What you see:**
A message appears saying "Invalid request" along with some description of what went wrong.

**Why this happens:**
The information sent to the server wasn't in the format it expected. This might happen if something unusual was entered in one of the form fields.

**How to fix it:**

1. **Review your entries** — Look at what you've typed in each field
2. **Check for special characters** — Avoid using unusual symbols in your location or preferences
3. **Try simpler values** — Use a standard city name or 5-digit zip code for location
4. **Clear and re-enter** — Click the Reset button and fill out the form fresh

**Example of good values:**
- Location: `San Francisco` or `94102`
- Kids Ages: `5, 8`
- Preferences: `outdoor activities, parks`

---

### "Something went wrong on the server" or 500 Error

**What you see:**
A message appears saying "Something went wrong on the server. Please try again."

**Why this happens:**
This is a temporary issue with the backend server. It's not caused by anything you did — sometimes servers just have brief hiccups.

**How to fix it:**

1. **Wait a moment** — Give it about 30 seconds
2. **Try again** — Click the "Generate Plan" button again
3. **Refresh the page** — If trying again doesn't work, refresh your browser and start fresh

**Good news:** These errors are usually temporary and resolve themselves quickly. If the error keeps happening after several tries over a few minutes, the server may need attention from a technical team.

---

## Still Having Problems?

If you've tried the solutions above and are still experiencing issues, here's what you can do:

### Get More Help

1. **Check the User Guide** — Review the [User Guide](user-guide.md) for detailed information about how to use each feature correctly.

2. **Review Getting Started** — The [Getting Started](getting-started.md) guide can help ensure everything is set up correctly.

3. **Report a Bug** — If you believe you've found a problem with the application itself, you can report it by visiting the project's GitHub page and creating an issue. When reporting a bug, it helps to include:
   - What you were trying to do
   - What you expected to happen
   - What actually happened
   - Any error messages you saw (the "Technical Details" section can be helpful here)

### Before Reaching Out

Try these final troubleshooting steps:

1. **Close and reopen your browser** — This clears temporary data that might be causing issues
2. **Try a different browser** — If you're using Chrome, try Firefox or Edge
3. **Clear your browser cache** — Look for this option in your browser's settings menu
4. **Check if others have the same problem** — If the backend server is shared, ask colleagues if they're experiencing similar issues

---

## Quick Reference: Error Messages

| What You See | What It Means | Quick Fix |
|--------------|---------------|-----------|
| "Couldn't reach the backend" | Backend server not running | Start the backend server |
| "Connection blocked" | Browser security blocking request | Check proxy configuration |
| Button is grayed out | Required fields missing | Fill in Location and both dates |
| "End date must be on or after start date" | Dates in wrong order | Fix date selection |
| "Request timed out" | Taking too long | Try again |
| "Unexpected response format" | Server sent unusual response | Refresh page and retry |
| "Invalid request" (400) | Form data issue | Check and simplify your inputs |
| "Something went wrong" (500) | Server issue | Wait and retry |

---

**Remember:** Technology doesn't always work perfectly, and that's okay. Most issues have simple solutions, and we're here to help you through them. Happy planning! 🎉
