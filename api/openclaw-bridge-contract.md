# OpenClaw Bridge Contract for OSION Load Pilot

## Purpose
This bridge accepts only one safe analysis job:
- `loadpilot_project_twin_analysis`

It must return only structured Project-Twin JSON.

## Required security rules
- Accept only `POST`
- Require `Authorization: Bearer <OPENCLAW_BRIDGE_SECRET>`
- Reject any jobType except `loadpilot_project_twin_analysis`
- Reject bodies without `input`
- Limit input length
- No shell execution
- No file operations
- No email sending
- No external side effects
- Timeout the analysis
- Return controlled JSON errors

## Request shape
```json
{
  "jobType": "loadpilot_project_twin_analysis",
  "promptVersion": "loadpilot_v2",
  "input": "...",
  "outputFormat": "project_twin_json",
  "prompt": "OSION analysis prompt",
  "agents": [
    "project_detector",
    "actor_mapper",
    "dependency_graph_builder",
    "risk_simulator",
    "scenario_generator",
    "next_move_synthesizer"
  ]
}
```

## Response shape
```json
{
  "result": {
    "project": {
      "title": "string",
      "description": "string",
      "type": "string",
      "status": "active | blocked | waiting | parked"
    },
    "nextMove": {
      "title": "string",
      "reason": "string",
      "effort": "low | medium | high",
      "impact": "low | medium | high",
      "deadline": "string | null"
    },
    "actors": [],
    "dependencies": [],
    "risks": [],
    "scenarios": [],
    "actions": []
  }
}
```

## Notes
The Vercel app calls this bridge server-to-server only. Never expose the bridge secret to the frontend.
