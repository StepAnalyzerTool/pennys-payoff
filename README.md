# Penny’s Playdate 🐾

Streamlit caregiver-response research prototype. The GitHub repository and deployment location remain `StepAnalyzerTool/pennys-payoff`; the app and downloaded data use Penny’s Playdate.

## Run and deploy

Install `requirements.txt`, then run `streamlit run app.py`. Streamlit Community Cloud entry point: `app.py`, branch `main`.

## Setup

The sound test appears first. Researcher setup selects the target response (Say “Stop Barking!” or Pet Penny) and condition (No barking, Negative reinforcement, Extinction). The participant sees the selected response and Tell Penny “Sit!”, with no condition names or contingency explanation. Both buttons are always available during the session; each click is recorded.

Defaults: 5 trials, 20-second observation windows, 40-second onset intervals, and a 5-second extinction omission requirement. The 40-second interval is a provisional shortened schedule, still adjustable. Quiet lead-in lasts one interval. Default onsets: 40, 80, 120, 160, 200 seconds. Default session end: 240 seconds, extended if an extinction episode is ongoing.

- No barking: quiet throughout, with identical observation windows and posture resets.
- Negative reinforcement: each trial starts barking; the target response immediately stops it until the next scheduled onset. Without a target response it stops after the trial window.
- Extinction: barking lasts at least the trial window and stops only when 5 seconds have elapsed without a target response. Repeated target responses reset that requirement; Sit does not.
- Every actual trial onset resets posture to standing. Sit changes posture to sitting without changing barking. Posture persists through the quiet period; petting preserves posture. Repeated Sit responses are recorded but do not restart the sitting transition.
- No response-dependent future barking probabilities, toy response, or black screens.

The original study used 30-second windows, 60-second onsets, and usually 9 trials. This prototype is an adaptation, not an exact replication. Its explicit overlap policy (not specified in the article): if extinction continues across a scheduled onset, that onset is skipped and logged. Do not reset posture or cut off the ongoing episode. Do not add replacement trials. Session end waits for extinction to finish; End session always remains available.

Reference: Miller, Lerman, & Fritz (2010), https://doi.org/10.1901/jaba.2010.43-769.

## Media and researcher preview

Only the original mixed-posture barking clip and sound check are currently available for this version. Researcher preview is on by default and clearly identified. Missing barking visuals can use `barking.mp4`; missing quiet visuals use a text placeholder. Missing petting does not show an actual pet action. Model posture is shown separately from temporary footage. Preview data are flagged in all exports. This is for checking the interface and contingencies, not collecting study data with completed stimuli.

Turn preview off to require all clips needed for the selected condition and target response. Upload these to `frontend/media`:

- `standing-barking.mp4`
- `standing-quiet.mp4`
- `sit-barking.mp4`
- `sit-quiet.mp4`
- `standing-petting-barking.mp4`
- `standing-petting-quiet.mp4`
- `sitting-petting-barking.mp4`
- `sitting-petting-quiet.mp4`

Sit clips must finish the transition within 2 seconds; the seated loop starts at second 2. Inspect that segment before using new footage. Pet clips play once (up to 8 seconds) before returning to the matching posture/state loop. Repeated pet responses are recorded without restarting an ongoing pet animation. Sit can interrupt petting; scheduled onsets override action animations. Barking changes select the corresponding quiet/barking variant. No command audio is generated or played yet; responses are labeled buttons with brief visual acknowledgement. `sound-check.mp3` is used only by the startup audio player. The toy clip is retained in the repository but unused.

Browser playback, buffering, background tabs and media transitions can affect actual presentation timing. The clock runs independently of clip duration; waiting and visibility events are logged. Inspect new clips and actual playback before data collection.

## Data

Download trial CSV, response CSV, and full JSON. Trial counts/occurrence cover the fixed observation windows, including quiet responses following early relief. Responses in initial quiet, between trials, or during an extinction extension are separately tagged in the response log. Skipped windows have `skipped=true` and should not be interpreted as observed zero-response trials. Exports identify caregiver target, condition and preview status. JSON contains settings, actual episode offsets, all responses, event logs and end reason. There is no automatic participant-data storage; download before closing or refreshing.

## Checks

`node tests/task.test.cjs` checks the pure timing/response model, including omission extensions, overlap, posture and quiet responses. `node tests/ui.test.cjs` checks setup and controller integration with simulated DOM/media. Actual audiovisual playback needs a check in the deployed app.
