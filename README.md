# Penny’s Playdate 🐾

Streamlit caregiver-response research prototype. The GitHub repository and deployment location remain `StepAnalyzerTool/pennys-payoff`; the app and downloaded data use Penny’s Playdate.

## Run and deploy

Install `requirements.txt`, then run `streamlit run app.py`. Streamlit Community Cloud entry point: `app.py`, branch `main`.

## Setup

The sound test appears first. Researcher setup selects the target response (“Penny, stop barking!” or Pet Penny) and condition (No barking, Negative reinforcement, Extinction). The participant is asked to play with Penny and teach her to sit. Four buttons remain available throughout: Penny, stop barking!; Pet Penny; Good girl, Penny!; and Tell Penny “Sit!”. Condition names and the target selection are hidden. Every click is recorded.

Defaults: 5 trials, 20-second observation windows, 40-second onset intervals, and a 5-second extinction omission requirement. The 40-second interval is a provisional shortened schedule, still adjustable. Quiet lead-in lasts one interval. Default onsets: 40, 80, 120, 160, 200 seconds. Default session end: 240 seconds, extended if an extinction episode is ongoing.

- No barking: quiet throughout, with identical observation windows and posture resets.
- Negative reinforcement: each trial starts barking; the target response immediately stops it until the next scheduled onset. Without a target response it stops after the trial window.
- Extinction: barking lasts at least the trial window and stops only when 5 seconds have elapsed without a target response. Repeated target responses reset that requirement; the other caregiver response, praise, and Sit do not.
- Every actual trial onset resets posture to standing. Sit changes posture to sitting without changing barking. Posture persists through the quiet period; petting preserves posture. Repeated Sit responses are recorded but do not restart the sitting transition.
- No response-dependent future barking probabilities, toy response, or black screens.

The original study used 30-second windows, 60-second onsets, and usually 9 trials. This prototype is an adaptation, not an exact replication. Its explicit overlap policy (not specified in the article): if extinction continues across a scheduled onset, that onset is skipped and logged. Do not reset posture or cut off the ongoing episode. Do not add replacement trials. Session end waits for extinction to finish; End session always remains available.

Reference: Miller, Lerman, & Fritz (2010), https://doi.org/10.1901/jaba.2010.43-769.

## Media and researcher preview

All 10 supplied videos and three spoken recordings are connected using their original filenames in `frontend/media`. The media checklist shows their availability. Normal playback is the default; researcher preview must be explicitly enabled to permit missing media.

Standing and sitting base clips loop. Standing-to-sitting and petting clips play once to their natural end, then return to the corresponding posture/barking base. Repeated pet clicks are recorded without restarting an ongoing pet animation. Sit can interrupt standing petting; Pet can interrupt a sitting transition and uses the seated petting clip. Scheduled onsets override action animations. Barking changes immediately select the paired quiet/barking video, preserving action playback position where possible.

Quiet videos are always muted, including their background music. Barking videos retain their supplied audio. The Stop, Sit, and Good girl buttons play the matching M4A recordings. A new button response interrupts any previous spoken recording; every click is still logged. There is no separate petting audio. `sound-check.mp3` is used only by the startup audio player. The old toy clip is unused.

Preview can use the original mixed-posture barking clip or a text placeholder if media are missing. Preview exports are flagged. Normal mode requires all media for the selected condition, including both caregiver actions regardless of target selection.

Browser playback, buffering, background tabs and media transitions can affect actual presentation timing. The clock runs independently of clip duration; waiting and visibility events are logged. Inspect new clips and actual playback before data collection.

## Data

Download trial CSV, response CSV, and full JSON. Trial counts/occurrence cover the fixed observation windows, including quiet responses following early relief. Responses in initial quiet, between trials, or during an extinction extension are separately tagged in the response log. Skipped windows have `skipped=true` and should not be interpreted as observed zero-response trials. Exports identify caregiver target, condition and preview status. Trial CSV includes separate stop, pet, praise, and sit counts plus target counts. Responses identify the actual action and whether it was the selected target. JSON contains settings, actual episode offsets, all responses, event logs and end reason. There is no automatic participant-data storage; download before closing or refreshing.

## Checks

`node tests/task.test.cjs` checks the pure timing/response model, including omission extensions, overlap, posture and quiet responses. `node tests/ui.test.cjs` checks setup and controller integration with simulated DOM/media. Actual audiovisual playback needs a check in the deployed app.

