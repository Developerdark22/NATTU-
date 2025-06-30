document.addEventListener('DOMContentLoaded', () => {
    const speech = window.speechSynthesis;
    let currentWorkout = [];
    let currentStepIndex = 0;
    let timerInterval;
    let countdownTime = 0;
    let currentTheme = localStorage.getItem('workoutAppTheme') || 'gradient-dark';

    // UI Elements
    const builderScreen = document.getElementById('builder-screen');
    const startScreen = document.getElementById('start-screen');
    const sessionScreen = document.getElementById('session-screen');
    const endScreen = document.getElementById('end-screen');

    const workoutInput = document.getElementById('workout-input');
    const addWorkoutBtn = document.getElementById('add-workout-btn');
    const savedWorkoutsList = document.getElementById('saved-workouts-list');
    const clearAllWorkoutsBtn = document.getElementById('clear-all-workouts-btn');

    const startWorkoutBtn = document.getElementById('start-workout-btn');
    const backToBuilderBtn = document.getElementById('back-to-builder-btn');
    const greetingMessage = document.getElementById('greeting-message');

    const currentStepTitle = document.getElementById('current-step-title');
    const currentStepText = document.getElementById('current-step-text');
    const countdownTimer = document.getElementById('countdown-timer');
    const nextStepBtn = document.getElementById('next-step-btn');
    const stopWorkoutBtn = document.getElementById('stop-workout-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    const finalMotivation = document.getElementById('final-motivation');
    const newWorkoutBtn = document.getElementById('new-workout-btn');

    const themeRadios = document.querySelectorAll('input[name="theme"]');

    // --- Core Functions ---

    function speak(text) {
        if (speech.speaking) {
            speech.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Or choose other languages/voices if available
        // You could add voice selection here with:
        // utterance.voice = speech.getVoices().find(voice => voice.name === 'Google US English Male');
        speech.speak(utterance);
    }

    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    function loadSavedWorkouts() {
        const workouts = JSON.parse(localStorage.getItem('savedWorkouts') || '[]');
        savedWorkoutsList.innerHTML = '';
        if (workouts.length === 0) {
            savedWorkoutsList.innerHTML = '<li>No saved workouts yet.</li>';
            return;
        }
        workouts.forEach((workout, index) => {
            const li = document.createElement('li');
            const workoutNameSpan = document.createElement('span');
            workoutNameSpan.textContent = workout.name;
            workoutNameSpan.title = "Click to load";
            workoutNameSpan.addEventListener('click', () => {
                workoutInput.value = workout.steps.join('\n');
                currentWorkout = workout.steps; // Also set as current workout for immediate use
                showScreen(startScreen);
                speak(`Loaded workout: ${workout.name}. Ready to start?`);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;'; // Times symbol for delete
            deleteBtn.title = 'Delete workout';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent loading when deleting
                deleteWorkout(index);
            });

            li.appendChild(workoutNameSpan);
            li.appendChild(deleteBtn);
            savedWorkoutsList.appendChild(li);
        });
    }

    function saveWorkout(workoutName, workoutSteps) {
        const workouts = JSON.parse(localStorage.getItem('savedWorkouts') || '[]');
        const existingIndex = workouts.findIndex(w => w.name === workoutName);

        if (existingIndex > -1) {
            // Update existing workout
            workouts[existingIndex].steps = workoutSteps;
        } else {
            // Add new workout
            workouts.push({ name: workoutName, steps: workoutSteps });
        }
        localStorage.setItem('savedWorkouts', JSON.stringify(workouts));
        loadSavedWorkouts();
    }

    function deleteWorkout(index) {
        let workouts = JSON.parse(localStorage.getItem('savedWorkouts') || '[]');
        workouts.splice(index, 1);
        localStorage.setItem('savedWorkouts', JSON.stringify(workouts));
        loadSavedWorkouts();
        speak("Workout deleted.");
    }

    function clearAllSavedWorkouts() {
        if (confirm("Are you sure you want to delete all saved workouts?")) {
            localStorage.removeItem('savedWorkouts');
            loadSavedWorkouts();
            speak("All saved workouts cleared.");
        }
    }

    function parseWorkoutSteps(inputText) {
        return inputText.split('\n')
                        .map(step => step.trim())
                        .filter(step => step !== '');
    }

    function startTimer(duration) {
        clearInterval(timerInterval);
        countdownTime = duration;
        countdownTimer.textContent = formatTime(countdownTime);

        if (duration <= 0) {
            countdownTimer.textContent = ''; // Clear timer if no duration
            return;
        }

        timerInterval = setInterval(() => {
            countdownTime--;
            countdownTimer.textContent = formatTime(countdownTime);

            if (countdownTime <= 0) {
                clearInterval(timerInterval);
                speak("Time's up!");
                // Optionally auto-advance or provide a signal
            }
        }, 1000);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function updateProgressBar() {
        const progress = ((currentStepIndex) / currentWorkout.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Step ${currentStepIndex} of ${currentWorkout.length}`;
    }

    function applyTheme(theme) {
        document.body.className = ''; // Clear existing classes
        document.body.classList.add(theme);
        localStorage.setItem('workoutAppTheme', theme);

        // Set radio button
        themeRadios.forEach(radio => {
            if (radio.value === theme) {
                radio.checked = true;
            }
        });
    }

    // --- Event Listeners ---

    addWorkoutBtn.addEventListener('click', () => {
        const steps = parseWorkoutSteps(workoutInput.value);
        if (steps.length === 0) {
            alert('Please enter some workout steps.');
            return;
        }

        let workoutName = prompt("Enter a name for this workout (e.g., 'Morning Routine', 'Leg Day'):");
        if (workoutName) {
            workoutName = workoutName.trim();
            if (workoutName) {
                saveWorkout(workoutName, steps);
                currentWorkout = steps; // Set current workout for immediate start
                showScreen(startScreen);
                speak(`Workout "${workoutName}" saved. Ready to begin?`);
            } else {
                alert("Workout name cannot be empty.");
            }
        } else {
            // User cancelled prompt, still transition if steps exist
            currentWorkout = steps;
            showScreen(startScreen);
            speak("Workout steps entered. Ready to begin?");
        }
    });

    startWorkoutBtn.addEventListener('click', () => {
        if (currentWorkout.length === 0) {
            alert('No workout steps loaded. Please go back to the builder.');
            return;
        }
        currentStepIndex = 0;
        showScreen(sessionScreen);
        currentStepTitle.textContent = "Let's Begin!";
        currentStepText.textContent = "Get ready for your first exercise!";
        speak("Workout starting now! Get ready.");
        setTimeout(() => displayNextStep(), 3000); // Give user a moment to prepare
    });

    backToBuilderBtn.addEventListener('click', () => {
        showScreen(builderScreen);
        speak("Back to workout builder.");
    });

    nextStepBtn.addEventListener('click', displayNextStep);

    stopWorkoutBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        speech.cancel();
        showScreen(endScreen);
        finalMotivation.textContent = "You stopped the workout. It's okay, every step counts! You've got this for next time.";
        speak("Workout stopped. You can do it next time!");
    });

    newWorkoutBtn.addEventListener('click', () => {
        workoutInput.value = ''; // Clear input for new workout
        showScreen(builderScreen);
        speak("Ready to build a new workout.");
    });

    clearAllWorkoutsBtn.addEventListener('click', clearAllSavedWorkouts);

    themeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            applyTheme(event.target.value);
        });
    });

    // --- Workout Session Logic ---

    function displayNextStep() {
        clearInterval(timerInterval); // Stop any existing timer
        countdownTimer.textContent = ''; // Clear timer display

        if (currentStepIndex < currentWorkout.length) {
            const step = currentWorkout[currentStepIndex];
            let stepText = step;
            let timerDuration = 0;

            // Check for timer pattern like "(30s)" or "(1m 30s)"
            const timerMatch = step.match(/\((\d+)(s)?\s*(\d+)?(m)?\)/i);
            if (timerMatch) {
                let seconds = parseInt(timerMatch[1]) || 0;
                let minutes = parseInt(timerMatch[3]) || 0;

                if (timerMatch[2] === 's') { // X seconds
                    timerDuration = seconds;
                } else if (timerMatch[4] === 'm') { // X minutes
                    timerDuration = seconds * 60; // Here seconds is actually minutes if 'm' is present first
                    // Re-evaluate to be sure: (Xm Ys) -> X=min, Y=sec. (Xs) -> X=sec
                    // A more robust regex would be needed for complex cases, for simplicity:
                    // (30s) or (1m) or (1m 30s)
                    if (timerMatch[4] === 'm') { // The second capture group for minutes
                        minutes = parseInt(timerMatch[1]) || 0;
                        seconds = parseInt(timerMatch[3]) || 0; // if (1m 30s)
                    } else { // It's just seconds
                        seconds = parseInt(timerMatch[1]) || 0;
                    }
                    timerDuration = (minutes * 60) + seconds;
                }
                // Updated logic for time parsing
                const timeMatch = step.match(/\((\d+)(?:s)?(?:\s*(\d+)m)?\)/i);
                if (timeMatch) {
                    let totalSeconds = 0;
                    if (timeMatch[2] === 'm') { // It's in minutes (e.g., (1m 30s) - not perfect, but good enough for simple)
                        const mins = parseInt(timeMatch[1]);
                        const secs = parseInt(timeMatch[2]); // This capture group would be for seconds if (1m 30s)

                        // Re-parsing for clarity: (NUMBER s) OR (NUMBER m) OR (NUMBER m NUMBER s)
                        const sMatch = step.match(/\((\d+)s\)/i);
                        const mMatch = step.match(/\((\d+)m\)/i);
                        const msMatch = step.match(/\((\d+)m\s+(\d+)s\)/i);

                        if (msMatch) {
                            totalSeconds = parseInt(msMatch[1]) * 60 + parseInt(msMatch[2]);
                        } else if (mMatch) {
                            totalSeconds = parseInt(mMatch[1]) * 60;
                        } else if (sMatch) {
                            totalSeconds = parseInt(sMatch[1]);
                        }

                        if(totalSeconds > 0) {
                            timerDuration = totalSeconds;
                            // Remove timer text from the step description for display
                            stepText = step.replace(timeMatch[0], '').trim();
                        }
                    } else if (timerMatch[2] === 's') {
                        timerDuration = parseInt(timerMatch[1]);
                        stepText = step.replace(timerMatch[0], '').trim();
                    } else if (timerMatch[4] === 'm') {
                        timerDuration = parseInt(timerMatch[1]) * 60;
                        stepText = step.replace(timerMatch[0], '').trim();
                    }

                    // A more robust and cleaner way to parse:
                    const durationRegex = /\((\d+)(s)?\s*(\d+)?(m)?\)/i;
                    const durationMatch = step.match(durationRegex);

                    if (durationMatch) {
                        let secondsPart = parseInt(durationMatch[1]);
                        let minutesPart = parseInt(durationMatch[3]);
                        let totalDuration = 0;

                        if (durationMatch[2] === 's' && !durationMatch[4]) { // Only seconds (e.g., (30s))
                            totalDuration = secondsPart;
                        } else if (durationMatch[4] === 'm' && !durationMatch[2]) { // Only minutes (e.g., (1m))
                            totalDuration = secondsPart * 60; // secondsPart here is actually minutes
                        } else if (durationMatch[4] === 'm' && durationMatch[2] === 's') { // (Xm Ys) (This regex is tricky for this)
                            // A better regex for (Xm Ys) would be needed
                            // For simplicity, we assume (Xs) or (Xm) or (Xm Ys) where Ys is optional
                            // The current regex will match (Xm) as (X m), or (Xs) as (X s)
                            // Let's refine the regex for robust parsing.
                            // New approach: separate patterns
                            const exactSecondsMatch = step.match(/\((\d+)s\)/i);
                            const exactMinutesMatch = step.match(/\((\d+)m\)/i);
                            const minutesSecondsMatch = step.match(/\((\d+)m\s+(\d+)s\)/i);

                            if (minutesSecondsMatch) {
                                totalDuration = parseInt(minutesSecondsMatch[1]) * 60 + parseInt(minutesSecondsMatch[2]);
                                stepText = step.replace(minutesSecondsMatch[0], '').trim();
                            } else if (exactMinutesMatch) {
                                totalDuration = parseInt(exactMinutesMatch[1]) * 60;
                                stepText = step.replace(exactMinutesMatch[0], '').trim();
                            } else if (exactSecondsMatch) {
                                totalDuration = parseInt(exactSecondsMatch[1]);
                                stepText = step.replace(exactSecondsMatch[0], '').trim();
                            }
                        }

                        if (totalDuration > 0) {
                            timerDuration = totalDuration;
                            // Ensure the time part is removed from the displayed text
                            stepText = step.replace(/\((\d+)(s)?\s*(\d+)?(m)?\)/i, '').trim();
                        }
                    }
                }
            }


            currentStepTitle.textContent = `Step ${currentStepIndex + 1}`;
            currentStepText.textContent = stepText;
            speak(stepText);
            startTimer(timerDuration);
            updateProgressBar();

            currentStepIndex++;
        } else {
            // Workout complete
            clearInterval(timerInterval);
            speech.cancel();
            showScreen(endScreen);
            finalMotivation.textContent = "Congratulations! You've crushed your workout! Keep up the great work!";
            speak("Workout complete! Congratulations, you've crushed your workout! Keep up the great work!");
        }
    }

    // --- Initializations ---

    // Load saved workouts and apply theme on start
    loadSavedWorkouts();
    applyTheme(currentTheme);

    // Initial screen display
    showScreen(builderScreen);

    // Check if SpeechSynthesis is ready (important for some browsers)
    speech.onvoiceschanged = () => {
        // You can populate a voice selection dropdown here if needed
        console.log("Voices ready:", speech.getVoices());
    };

    // Placeholder for assets
    // Ensure you have these files in your assets folder or remove them if not used
    // assets/favicon.ico
    // assets/gym_animation.gif (replace with a real GIF or remove)
    // assets/trophy.gif (replace with a real GIF or remove)
});

