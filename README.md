# Penny’s Playdate 🐾

Streamlit caregiver-response research prototype. Repository: StepAnalyzerTool/pennys-payoff. Run `streamlit run app.py` after installing requirements.txt. Deployment uses branch main and entry point app.py.

## Setup and session

The sound test uses flute-db-test.wav with an instruction to adjust the sound level to 70 dB. Researcher setup selects participant ID, target response (Penny, stop barking! or Pet Penny), condition, number of trials, and trial duration.

Defaults are five consecutive 30-second trials: onsets at 0, 30, 60, 90, and 120 seconds; the session ends at 150 seconds. The onset interval always equals the trial duration. There is no initial waiting period or gap between trials.

All four buttons remain available and repeatable: Say “Sit!”, Say “Penny, stop barking!”, Pet Penny, and Say “Good girl, Penny!”. “I’m done” ends the session immediately and opens the data-download screen.

- No barking: quiet throughout.
- Negative reinforcement: barking starts at each trial onset. Only the selected target response terminates barking, producing quiet until the next onset. Without a target response, barking continues across trial boundaries until the session ends.
- Extinction: barking continues across all five trials regardless of responding, until the session ends. There is no timed cutoff, omission interval, extension, or skipped trial.
- Penny starts each trial standing. Sit changes posture without changing barking; posture persists until the next onset. Petting preserves posture; praise never changes barking.

This is an adaptation, not an exact replication, of Miller, Lerman, & Fritz (2010), https://doi.org/10.1901/jaba.2010.43-769.

## Media

Ten uploaded videos and three spoken recordings are used. Playback uses lowercase filenames with hyphens; original filenames are retained in the repository. Quiet videos are muted, while barking videos retain their supplied audio. Spoken responses use their corresponding M4A recordings.

Standing and seated base clips loop. Sitting transitions and petting clips play once and return to the corresponding base. If barking stops during a sitting transition, playback switches directly to the seated quiet base. Repeated pet clicks are recorded without restarting the current petting animation. A new spoken response interrupts the previous spoken recording. Scheduled trial onsets reset posture and action animations.

The session clock runs independently of clip duration. Browser buffering and clip joins can affect presentation; video waiting and visibility changes are logged. The old toy and sound-check files are unused.

## Data

Download trial CSV, response CSV, and full JSON before leaving. There is no automatic participant-data storage.

Trial exports include counts for each action and the selected target, first-target latency, scheduled window boundaries, actual end time, barking state at the start/end of each observation window, and actual barking-offset time. A window ending does not imply barking stopped: actual_offset_ms may fall in a later trial if barking continued. An early exit truncates the current window. Response records identify the actual action, selected-target status, trial, ongoing barking episode origin, and whether the response terminated barking. JSON includes settings, event logs, end reason, and elapsed time. Version 0.4.0 uses the contiguous-trial protocol.

## Checks

Run `node tests/task.test.cjs` and `node tests/ui.test.cjs`. These cover five contiguous windows, both target selections, response-only relief, uninterrupted extinction state, seated relief, exact session termination, early exit, and stopping all media.
