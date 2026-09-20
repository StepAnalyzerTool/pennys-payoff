# Penny’s Payoff 🐾

A Streamlit video-choice research prototype starring Penny Lane.

## Run

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Deploy to Streamlit Community Cloud

Create an app from `StepAnalyzerTool/pennys-payoff`, branch `main`, entry point `app.py`. No secrets or database are required.

## Prototype rules

- Use the Test sound player at the top of setup to check device volume. Test audio stops when the session is prepared.

- Tangible Reinforcement is available. Petting Reinforcement is pending its outcome clip.
- First trial always starts with barking, with sound. Click Start session to enable playback.
- Only one response per barking trial; all response buttons immediately disable after selection.
- Throw the toy stops the barking video, plays the complete toy-toss clip once, and ends the trial when that clip finishes. This can extend beyond 20 seconds if selected late.
- Other responses leave barking running until 20 seconds from trial onset.
- Every trial ends with a one-second black screen, then the next trial begins automatically.
- Default 5 trials, initial barking probability 50%, changes of 10 percentage points, bounded at 10–90%. The first forced barking trial also updates this underlying probability after a response.
- Toy responses increase future barking probability; other responses decrease it. No response leaves the probability unchanged.
- Quiet trials show “Penny is quiet” for the trial duration, with buttons disabled, and leave probability unchanged.
- These are programmed simulation rules, not a validated model of a real dog's behavior.

Researcher setup allows changing trial count, timeout, black interval and probability parameters. Controls are hidden during the session. Participant instructions do not reveal the contingency. Browser timing is approximate; background tabs and buffering can affect it. Visibility changes and video waiting events are included in JSON.

## Media

Included clips: `frontend/media/barking.mp4` and `frontend/media/toy-toss.mp4`. Replace these files to update the stimuli. The toy clip retains its original audio; the creator confirmed the dog is quiet in it. No quiet-dog or petting clip is substituted with an unrelated video.

## Data

Download CSV trial data and JSON full session data after completion or early termination. JSON includes all settings and event records. CSV includes participant/session ID, trial, forced barking flag, random draw, probability before/after, response, latency, duration, timestamps and end reason. Interrupted trials are retained and identified by their end reason.

Data remain in page memory; refresh, closing the page or starting a new session discards them. There is no participant database or automatic server-side storage. Download before leaving. CSV protects text cells against formula interpretation.

## Validation

`node tests/task.test.cjs` exercises the task controller with simulated media and time: first trial, late toy selection, outcome completion, response lockout, timeout, black interval, probability changes, quiet and no-response trials, and early termination. Streamlit AppTest startup passed. Real browser audiovisual playback still requires deployment testing; browser installation was blocked in the development environment.
