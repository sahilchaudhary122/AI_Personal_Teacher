// Backend Configuration
const API_BASE = "https://ai-personal-teacher-api.vercel.app";

// Initialize API
async function initializeAPI() {
    try {
        const response = await fetch(`${API_BASE}/health`);

        if (response.ok) {
            console.log(`Connected to backend on ${API_BASE}`);
            return true;
        }

        throw new Error(`Backend returned ${response.status}`);
    } catch (e) {
        console.error("Backend connection failed:", e);
        showError("Could not connect to the backend API. Please try again later.");
        loading.classList.add("hidden");
        return false;
    }
}

// Your existing student UUID
const STUDENT_ID = "89c9c522-65c8-4743-99e2-60bc9d181a18";



// DOM Elements


const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");

const studentSection = document.getElementById("student-section");
const progressSection = document.getElementById("progress-section");
const assessmentSection = document.getElementById("assessment-section");
const lessonsSection = document.getElementById("lessons-section");

const studentName = document.getElementById("student-name");
const studentGrade = document.getElementById("student-grade");
const studentLevel = document.getElementById("student-level");
const studentLanguage = document.getElementById("student-language");
const studentGoal = document.getElementById("student-goal");

const progressContainer = document.getElementById("progress-container");
const assessmentContainer = document.getElementById("assessment-container");
const lessonsContainer = document.getElementById("lessons-container");

const lessonForm = document.getElementById("lesson-form");
const generateButton = document.getElementById("generate-button");

const generatedLesson = document.getElementById("generated-lesson");
const lessonTitle = document.getElementById("lesson-title");
const lessonMeta = document.getElementById("lesson-meta");
const objectivesList = document.getElementById("objectives-list");
const segmentsContainer = document.getElementById("segments-container");

// AI Media
const mediaSection = document.getElementById("media-section");
const mediaStatus = document.getElementById("media-status");
const generateMediaButton =
    document.getElementById("generate-media-button");

const visualContainer =
    document.getElementById("visual-container");

const generatedVisual =
    document.getElementById("generated-visual");

const audioContainer =
    document.getElementById("audio-container");

const generatedAudio =
    document.getElementById("generated-audio");

const videoContainer =
    document.getElementById("video-container");

const generatedVideo =
    document.getElementById("generated-video");


// QA Flow Elements
const qaSection = document.getElementById("qa-section");
const questionText = document.getElementById("question-text");
const studentAnswerInput = document.getElementById("student-answer");
const submitAnswerButton = document.getElementById("submit-answer-button");
const evaluationContainer = document.getElementById("evaluation-container");
const evaluationResult = document.getElementById("evaluation-result");
const evaluationFeedback = document.getElementById("evaluation-feedback");
const misconceptionText = document.getElementById("misconception-text");
const nextStepButton = document.getElementById("next-step-button");

// Language Selection
const languageSelector = document.getElementById("language");

function getSelectedLanguage() {
    // Priority: Select value, or default to "English"
    return languageSelector.value || "English";
}

// Get Next Teacher Step
async function getTeacherNextStep(lessonId) {
    try {
        const response = await fetch(
            `${API_BASE}/api/lesson/${lessonId}/teacher`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    student_id: STUDENT_ID,
                    difficulty: "beginner",
                    language: getSelectedLanguage()
                })
            }
        );

        if (!response.ok) {
            throw new Error("Failed to get next teacher step.");
        }

        return await response.json();
    } catch (error) {
        console.error("Error getting next teacher step:", error);
        return null;
    }
}

// Submit Answer
submitAnswerButton.addEventListener("click", async () => {
    const answer = studentAnswerInput.value.trim();
    if (!answer) return;

    const lessonId = currentLesson.lesson_id;

    // Safely retrieve the current concept, defaulting to topic if segments are missing
    let concept = "Unknown Concept";
    if (currentLesson.segments && currentLesson.segments.length > 0) {
        concept = currentLesson.segments[0].concept || "Unknown Concept";
    } else if (currentLesson.topic) {
        concept = currentLesson.topic;
    }

    const question = questionText.textContent;

    try {
        const response = await fetch(`${API_BASE}/api/lesson/evaluate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lesson_id: lessonId,
                student_id: STUDENT_ID,
                concept: concept,
                question: question,
                student_answer: answer,
                expected_answer: "...", // Need to get this from somewhere
                subject: currentLesson.subject,
                topic: currentLesson.topic,
                language: getSelectedLanguage()
            })
        });

        const result = await response.json();
        displayEvaluation(result);
    } catch (error) {
        console.error("Evaluation error:", error);
        showError("Failed to evaluate answer.");
    }
});

// Display Evaluation
// Display Evaluation
function displayEvaluation(result) {
    evaluationContainer.classList.remove("hidden");
    evaluationResult.textContent = result.correct ? "Correct!" : "Incorrect";
    evaluationFeedback.textContent = result.feedback;

    // Clear adaptive section
    const adaptiveEl = document.getElementById("adaptive-section");
    if (adaptiveEl) {
        adaptiveEl.innerHTML = "";
    }

    if (result.adaptive_response) {
        if (!adaptiveEl) {
            // Create it if it doesn't exist
            const section = document.createElement("div");
            section.id = "adaptive-section";
            evaluationContainer.appendChild(section);
        }
        const el = document.getElementById("adaptive-section");
        el.innerHTML = `
            <div class="adaptive-content" style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
                <p><strong>Teacher:</strong> I see where the confusion is. Let's look at it another way.</p>
                <p><em>${escapeHTML(result.adaptive_response.explanation)}</em></p>
                ${result.adaptive_response.example ? `<p><strong>Example:</strong> ${escapeHTML(result.adaptive_response.example)}</p>` : ""}
                <div class="follow-up" style="margin-top: 10px; padding: 10px; background: #e9ecef; border-radius: 5px;">
                    <p><strong>Follow-up Question:</strong> ${escapeHTML(result.adaptive_response.next_question)}</p>
                </div>
            </div>
        `;
        // Update main question text if follow-up exists
        questionText.textContent = result.adaptive_response.next_question;

        // Play audio if available
        if (result.adaptive_response.audio_url) {
            const container = document.createElement("div");
            container.style.marginTop = "10px";
            container.innerHTML = `<p><strong>🔊 Teacher Explanation:</strong></p>`;

            const audioEl = document.createElement("audio");
            audioEl.id = "adaptive-teacher-audio";
            audioEl.controls = true;
            audioEl.preload = "auto";
            audioEl.src = `${API_BASE}${result.adaptive_response.audio_url}`;

            container.appendChild(audioEl);
            el.appendChild(container);

            audioEl.load();
            audioEl.play().catch(e => console.warn("Autoplay blocked:", e));
        }

        // Show visual if available
        if (result.adaptive_response.visual_url) {
            const visualEl = document.createElement("img");
            visualEl.src = `${API_BASE}${result.adaptive_response.visual_url}`;
            visualEl.alt = "Adaptive Educational Visual";
            visualEl.style.marginTop = "10px";
            visualEl.style.maxWidth = "100%";
            visualEl.style.borderRadius = "5px";
            el.appendChild(visualEl);
        }
    }

    if (result.misconception_description) {
        misconceptionText.textContent = `Misconception: ${result.misconception_description}`;
        misconceptionText.classList.remove("hidden");
    } else {
        misconceptionText.classList.add("hidden");
    }

    nextStepButton.classList.remove("hidden");
}

// Next Step
nextStepButton.addEventListener("click", async () => {
    // Logic to move to next step
    evaluationContainer.classList.add("hidden");
    studentAnswerInput.value = "";
    // Fetch next step...
});



// Auth State
let isLoginMode = true;

// Auth UI Elements
const authSection = document.getElementById("auth-section");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authButton = document.getElementById("auth-button");
const authToggleText = document.getElementById("auth-toggle-text");
const authToggleButton = document.getElementById("auth-toggle-button");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");

// Auth Toggle Listener
authToggleButton.addEventListener("click", () => {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? "Login" : "Sign Up";
    authButton.textContent = isLoginMode ? "Login" : "Sign Up";
    authToggleText.textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
    authToggleButton.textContent = isLoginMode ? "Sign Up" : "Login";
});

// Auth Form Listener
authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!API_BASE) {
        const success = await initializeAPI();
        if (!success) return;
    }

    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/signup";

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error(isLoginMode ? "Login failed" : "Sign up failed");
        }

        const data = await response.json();

        // Handle token storage
        const token = data.session?.access_token || data.access_token;
        const refreshToken = data.session?.refresh_token || data.refresh_token;
        if (token) {
            setAuthToken(token, refreshToken);
            alert(isLoginMode ? "Login successful!" : "Sign up successful! Please login.");
            if (isLoginMode) {
                authSection.classList.add("hidden");
                loadDashboard();
            } else {
                isLoginMode = true;
                authToggleButton.click();
            }
        } else {
            throw new Error("No token received");
        }
    } catch (error) {
        console.error("Auth error:", error);
        alert(error.message);
    }
});

function getAuthToken() {
    return localStorage.getItem("auth_token");
}

function setAuthToken(token, refreshToken = null) {
    localStorage.setItem("auth_token", token);
    if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
    }
}

function getRefreshToken() {
    return localStorage.getItem("refresh_token");
}

function getAuthHeaders() {
    return { "Content-Type": "application/json" };
}

// Global Fetch Wrapper
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
    const token = getAuthToken();
    if (token) {
        options.headers = { ...options.headers, "Authorization": `Bearer ${token}` };
    }

    let response = await originalFetch(url, options);

    if (response.status === 401) {
        console.log("AUTH: 401 Detected for:", url);
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            console.log("AUTH: Attempting Refresh");
            const refreshResponse = await originalFetch(`${API_BASE}/api/auth/refresh`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            if (refreshResponse.ok) {
                console.log("AUTH: Refresh Success");
                const data = await refreshResponse.json();
                const newToken = data.session?.access_token || data.access_token;
                const newRefresh = data.session?.refresh_token || data.refresh_token;
                setAuthToken(newToken, newRefresh);

                // Retry original request
                options.headers["Authorization"] = `Bearer ${newToken}`;
                console.log("AUTH: Retrying Request");
                return await originalFetch(url, options);
            } else {
                console.log("AUTH: Refresh Failed");
            }
        } else {
            console.log("AUTH: No Refresh Token Found");
        }
        // If refresh fails
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        window.location.reload();
    }
    return response;
};
const learningPathSection = document.getElementById("learning-path-section");
const learningPathContainer = document.getElementById("learning-path-container");

// Load Dashboard
async function loadDashboard() {
    if (!API_BASE) {
        const success = await initializeAPI();
        if (!success) return;
    }

    try {

        hideError();

        // Fetch dashboard
        const dashboardResp = await fetch(`${API_BASE}/api/students/${STUDENT_ID}/dashboard`);
        if (!dashboardResp.ok) throw new Error(`Dashboard request failed: ${dashboardResp.status}`);

        const data = await dashboardResp.json();

        displayStudent(data.student);
        displayProgress(data.progress);
        displayAssessments(data.assessments);

        // Only auto-load Learning Path if no document is active.
        if (!currentDocumentId) {
            loadLearningPath();
        }

        displayLessons(data.lessons);
        loading.classList.add("hidden");

    } catch (error) {

        console.error("Dashboard error:", error);

        loading.classList.add("hidden");

        showError(
            "Unable to load the dashboard. Make sure your FastAPI backend is running."
        );
    }
}



// Display Student


function displayStudent(student) {

    studentName.textContent =
        student.name || "-";

    studentGrade.textContent =
        student.grade || "-";

    studentLevel.textContent =
        student.current_level || "-";

    studentLanguage.textContent =
        student.preferred_language || "-";

    studentGoal.textContent =
        student.learning_goals ||
        "No learning goal specified.";

    studentSection.classList.remove("hidden");
}



// Display Progress


function displayProgress(progress) {

    progressContainer.innerHTML = "";

    if (!progress || progress.length === 0) {

        progressContainer.innerHTML =
            `<div class="empty">
                No learning progress recorded yet.
            </div>`;

        progressSection.classList.remove("hidden");

        return;
    }

    progress.forEach(item => {

        const mastery =
            Number(item.mastery_score ?? 0);

        const safeMastery =
            Math.max(0, Math.min(100, mastery));

        const topic =
            item.topic ||
            item.subject ||
            "Learning Progress";

        const status =
            item.status ||
            "Not specified";

        const strength =
            item.strength ||
            "Not recorded";

        const weakness =
            item.weakness ||
            "Not recorded";

        const card =
            document.createElement("div");

        card.className =
            "progress-card";

        card.innerHTML = `
            <div class="progress-header">
                <h3>${escapeHTML(topic)}</h3>

                <span class="mastery">
                    ${safeMastery}%
                </span>
            </div>

            <div class="progress-bar">
                <div
                    class="progress-fill"
                    style="width: ${safeMastery}%"
                ></div>
            </div>

            <div class="progress-details">
                <span>
                    Status: ${escapeHTML(status)}
                </span>

                <span>
                    Strength: ${escapeHTML(strength)}
                </span>
            </div>

            <div class="progress-details">
                <span>
                    Weakness: ${escapeHTML(weakness)}
                </span>
            </div>
        `;

        progressContainer.appendChild(card);
    });

    progressSection.classList.remove("hidden");
}



// Display Assessments


function displayAssessments(assessments) {

    assessmentContainer.innerHTML = "";

    if (!assessments || assessments.length === 0) {

        assessmentContainer.innerHTML =
            `<div class="empty">
                No assessments completed yet.
            </div>`;

        assessmentSection.classList.remove("hidden");

        return;
    }

    const table =
        document.createElement("table");

    table.className =
        "assessment-table";

    table.innerHTML = `
        <thead>
            <tr>
                <th>Topic</th>
                <th>Score</th>
                <th>Result</th>
                <th>Feedback</th>
            </tr>
        </thead>

        <tbody></tbody>
    `;

    const tbody =
        table.querySelector("tbody");

    assessments.forEach(item => {

        const row =
            document.createElement("tr");

        const score =
            item.score ??
            item.marks ??
            "-";

        const result =
            item.is_correct === true
                ? "Correct"
                : item.is_correct === false
                    ? "Incorrect"
                    : item.result || "-";

        const resultClass =
            result.toLowerCase() === "correct"
                ? "correct"
                : result.toLowerCase() === "incorrect"
                    ? "incorrect"
                    : "";

        row.innerHTML = `
            <td>
                ${escapeHTML(item.topic || "-")}
            </td>

            <td>
                ${escapeHTML(String(score))}
            </td>

            <td class="${resultClass}">
                ${escapeHTML(result)}
            </td>

            <td>
                ${escapeHTML(item.feedback || "-")}
            </td>
        `;

        tbody.appendChild(row);
    });

    assessmentContainer.appendChild(table);

    assessmentSection.classList.remove("hidden");
}



// Global Lesson State
let currentLesson = null;
let currentDocumentId = null;

// Display Previous Lessons
function displayLessons(lessons) {
    lessonsContainer.innerHTML = "";

    if (!lessons || lessons.length === 0) {
        lessonsContainer.innerHTML =
            `<div class="empty">
                No previous lessons yet.
            </div>`;
        lessonsSection.classList.remove("hidden");
        return;
    }

    lessons.forEach(lesson => {
        const card = document.createElement("div");
        card.className = "lesson-card";
        card.innerHTML = `
            <h3>${escapeHTML(lesson.title || "Untitled Lesson")}</h3>
            <div class="lesson-info">
                <span>Subject: ${escapeHTML(lesson.subject || "-")}</span>
                <span>Topic: ${escapeHTML(lesson.topic || "-")}</span>
            </div>
            <button class="start-lesson-button" data-lesson-id="${lesson.id}">Start Lesson</button>
        `;

        card.querySelector(".start-lesson-button").addEventListener("click", () => {
            startLesson(lesson);
        });

        lessonsContainer.appendChild(card);
    });

    lessonsSection.classList.remove("hidden");
}

// Start Lesson Demo
async function startLesson(lesson) {
    // Prevent default form submission if triggered inside a form
    // (though startLesson is usually called from button clicks)

    // Fetch full lesson state to get segments
    try {
        const response = await fetch(`${API_BASE}/api/lesson/${lesson.id}/state?student_id=${STUDENT_ID}`);
        if (!response.ok) throw new Error("Failed to load lesson state");
        const lessonState = await response.json();

        currentLesson = { ...lesson, lesson_id: lesson.id, ...lessonState };
    } catch (e) {
        console.error("Error loading lesson state:", e);
        currentLesson = { ...lesson, lesson_id: lesson.id, segments: [{concept: "Unknown"}] };
    }

    // Do NOT hide all sections permanently,
    // just prepare the lesson area within the existing dashboard
    // or just show the QA and media sections.

    // Show QA and media section
    qaSection.classList.remove("hidden");
    mediaSection.classList.remove("hidden");

    // Smooth scroll to the lesson area
    qaSection.scrollIntoView({ behavior: 'smooth' });

    // Get next step
    const step = await getTeacherNextStep(lesson.id);
    if (step && step.content && step.content.explanation) {
        questionText.textContent = step.content.explanation;
    } else {
        questionText.textContent = "Teacher is ready. Please ask a question or await input.";
    }
}




// Generate Personalized Lesson


lessonForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const subject =
            document.getElementById("subject")
                .value
                .trim();

        const topic =
            document.getElementById("topic")
                .value
                .trim();

        const time =
            Number(
                document.getElementById("time").value
            );

        const language =
            document.getElementById("language").value;

        if (!subject || !topic || !time) {

            showError(
                "Please fill in all lesson fields."
            );

            return;
        }

        generateButton.disabled = true;

        generateButton.textContent =
            "Generating lesson...";

        hideError();

        generatedLesson.classList.add("hidden");

        // Hide old media
        mediaSection.classList.add("hidden");

        try {

            // Get actual student information
            const dashboardResponse =
                await fetch(
                    `${API_BASE}/api/students/${STUDENT_ID}/dashboard`
                );

            if (!dashboardResponse.ok) {
                throw new Error(
                    "Could not load student information."
                );
            }

            const dashboard =
                await dashboardResponse.json();

            const student =
                dashboard.student;

            const requestBody = {

                student_name:
                    student.name,

                grade:
                    student.grade,

                subject:
                    subject,

                topic:
                    topic,

                current_level:
                    student.current_level,

                language:
                    language || student.preferred_language,

                learning_goal:
                    student.learning_goals,

                available_time_minutes:
                    time
            };

            const response =
                await fetch(
                    `${API_BASE}/api/lesson/create`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                ...requestBody,
                                document_id: currentDocumentId
                            })
                    }
                );

            if (!response.ok) {

                let message =
                    `Lesson generation failed: ${response.status}`;

                try {

                    const errorData =
                        await response.json();

                    if (errorData.detail) {
                        message =
                            errorData.detail;
                    }

                } catch {
                    // Keep default message
                }

                throw new Error(message);
            }

            const lesson =
                await response.json();

            // Save current lesson
            currentLesson = {
                ...lesson,

                student: student
            };

            displayGeneratedLesson(
                currentLesson
            );

            // Refresh dashboard
            await loadDashboard();

        } catch (error) {

            console.error(
                "Lesson generation error:",
                error
            );

            showError(error.message);

        } finally {

            generateButton.disabled = false;

            generateButton.textContent =
                "✨ Generate Personalized Lesson";
        }
    }
);



// Display Generated Lesson


async function displayGeneratedLesson(lesson) {

    lessonTitle.textContent =
        lesson.title ||
        "Personalized Lesson";

    lessonMeta.textContent =
        `${lesson.subject || ""} • ` +
        `${lesson.topic || ""} • ` +
        `${lesson.difficulty || ""} • ` +
        `${lesson.total_duration_minutes || 0} minutes`;

    objectivesList.innerHTML = "";

    if (
        lesson.learning_objectives &&
        lesson.learning_objectives.length
    ) {

        lesson.learning_objectives.forEach(
            objective => {

                const li =
                    document.createElement("li");

                li.textContent =
                    objective;

                objectivesList.appendChild(li);
            }
        );

    } else {

        objectivesList.innerHTML =
            "<li>No objectives provided.</li>";
    }

    segmentsContainer.innerHTML = "";

    if (
        lesson.segments &&
        lesson.segments.length
    ) {

        lesson.segments.forEach(
            segment => {

                const card =
                    document.createElement("div");

                card.className =
                    "segment";

                card.innerHTML = `

                    <span class="segment-type">
                        ${escapeHTML(
                            segment.type ||
                            "Lesson"
                        )}
                    </span>

                    <h3>
                        ${escapeHTML(
                            segment.title ||
                            "Lesson Segment"
                        )}
                    </h3>

                    <p>
                        <strong>Concept:</strong>
                        ${escapeHTML(
                            segment.concept || "-"
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            segment.explanation || ""
                        )}
                    </p>

                    <span class="duration">
                        ⏱
                        ${escapeHTML(
                            String(
                                segment.duration_minutes ?? 0
                            )
                        )}
                        minutes
                    </span>
                `;

                segmentsContainer.appendChild(card);
            }
        );

    } else {

        segmentsContainer.innerHTML =
            `<div class="empty">
                No lesson segments were returned.
            </div>`;
    }

    // Show generated lesson
    generatedLesson.classList.remove(
        "hidden"
    );

    // Trigger Teacher Agent
    const nextStep = await getTeacherNextStep(lesson.lesson_id);
    if (nextStep && nextStep.teacher_status === "WAITING_FOR_STUDENT") {
        qaSection.classList.remove("hidden");
        questionText.textContent = nextStep.content.explanation; // Assuming explanation is the question
    }

    // IMPORTANT:
    // Show media section after lesson generation
    mediaSection.classList.remove(
        "hidden"
    );

    mediaStatus.textContent =
        "Generate visual, speech and video for this lesson.";

    mediaSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}



// Generate AI Learning Media


generateMediaButton.addEventListener(
    "click",
    async function() {

        if (!currentLesson) {

            showError(
                "Please generate a lesson first."
            );

            return;
        }

        const student =
            currentLesson.student || {};

        const subject =
            currentLesson.subject ||
            document.getElementById("subject")
                .value
                .trim();

        const topic =
            currentLesson.topic ||
            document.getElementById("topic")
                .value
                .trim();

        const grade =
            student.grade ||
            "10";

        const language =
            student.preferred_language ||
            currentLesson.language ||
            "English";

        generateMediaButton.disabled =
            true;

        generateMediaButton.textContent =
            "Generating learning media...";

        hideError();

        visualContainer.classList.add(
            "hidden"
        );

        audioContainer.classList.add(
            "hidden"
        );

        videoContainer.classList.add(
            "hidden"
        );

        mediaStatus.textContent =
            "Generating educational visual...";

        try {


            // 1. Generate Visual


            const firstSegment =
                currentLesson.segments &&
                currentLesson.segments.length
                    ? currentLesson.segments[0]
                    : null;

            const concept =
                firstSegment?.concept ||
                `Main concept of ${topic}`;

            const visualResponse =
                await fetch(
                    `${API_BASE}/api/visuals/generate`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                subject:
                                    subject,

                                topic:
                                    topic,

                                grade:
                                    grade,

                                concept:
                                    concept,

                                style:
                                    "educational diagram"
                            })
                    }
                );

            if (!visualResponse.ok) {

                const errorData =
                    await visualResponse.json();

                throw new Error(
                    errorData.detail ||
                    "Visual generation failed."
                );
            }

            const visualData =
                await visualResponse.json();

            const visualFile =
                visualData.output_file;

            if (!visualFile) {
                throw new Error(
                    "Visual generation returned no file."
                );
            }

            const visualFilename =
                getFilename(visualFile);

            generatedVisual.src =
                `${API_BASE}/media/${visualFilename}`;

            visualContainer.classList.remove(
                "hidden"
            );



            // 2. Generate Speech


            mediaStatus.textContent =
                `Generating AI teacher voice in ${language}...`;

            // Use actual lesson explanation
            const speechParts = [];

            speechParts.push(
                `Today we are learning about ${topic}.`
            );

            if (
                currentLesson.learning_objectives &&
                currentLesson.learning_objectives.length
            ) {

                speechParts.push(
                    `Our learning objectives are: ` +
                    currentLesson.learning_objectives.join(
                        ". "
                    )
                );
            }

            if (
                currentLesson.segments &&
                currentLesson.segments.length
            ) {

                currentLesson.segments.forEach(
                    segment => {

                        if (segment.title) {
                            speechParts.push(
                                segment.title
                            );
                        }

                        if (segment.explanation) {
                            speechParts.push(
                                segment.explanation
                            );
                        }
                    }
                );
            }

            const speechText =
                speechParts.join(" ");


            const speechResponse =
                await fetch(
                    `${API_BASE}/api/speech/tts`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                text:
                                    speechText,

                                voice:
                                    "Kore"
                            })
                    }
                );

            if (!speechResponse.ok) {

                const errorData =
                    await speechResponse.json();

                throw new Error(
                    errorData.detail ||
                    "Speech generation failed."
                );
            }

            const speechData =
                await speechResponse.json();

            const audioFile =
                speechData.output_file;

            if (!audioFile) {
                throw new Error(
                    "Speech generation returned no file."
                );
            }

            const audioFilename =
                getFilename(audioFile);

            generatedAudio.src =
                `${API_BASE}/media/${audioFilename}`;

            generatedAudio.load();

            audioContainer.classList.remove(
                "hidden"
            );



            // 3. Generate Video


mediaStatus.textContent =
    "Creating AI animated lesson video...";

const animationResponse =
    await fetch(
        `${API_BASE}/api/video/generate-animation`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify({

                    subject:
                        subject,

                    topic:
                        topic,

                    grade:
                        grade,

                    concept:
                        concept
                })
        }
    );

if (!animationResponse.ok) {

    let errorMessage =
        "AI animation generation failed.";

    try {

        const errorData =
            await animationResponse.json();

        errorMessage =
            errorData.detail ||
            errorMessage;

    } catch (e) {

        console.error(
            "Could not read animation error:",
            e
        );
    }

    throw new Error(
        errorMessage
    );
}

const animationData =
    await animationResponse.json();

console.log(
    "AI animation response:",
    animationData
);

const videoUrl =
    animationData.video_url;

if (!videoUrl) {

    throw new Error(
        "AI animation returned no video URL."
    );
}

generatedVideo.src =
    videoUrl.startsWith("http")
        ? videoUrl
        : `${API_BASE}${videoUrl}`;

generatedVideo.load();

videoContainer.classList.remove(
    "hidden"
);

mediaStatus.textContent =
    "AI animated learning video generated successfully!";

mediaSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
});

        } catch (error) {

            console.error(
                "Media generation error:",
                error
            );

            showError(
                error.message ||
                "AI learning media generation failed."
            );

            mediaStatus.textContent =
                "Media generation failed.";

        } finally {

            generateMediaButton.disabled =
                false;

            generateMediaButton.textContent =
                "✨ Generate Learning Media";
        }
    }
);


// Get Filename From Backend Path


function getFilename(filePath) {

    return String(filePath)
        .replace(/\\/g, "/")
        .split("/")
        .pop();
}



// Error Handling


function showError(message) {

    errorBox.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );
}


function hideError() {

    errorBox.textContent =
        "";

    errorBox.classList.add(
        "hidden"
    );
}



// Security Helper


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}

// Theme Toggle
const themeToggle = document.getElementById("theme-toggle");

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
}

// Initialize Theme
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";

themeToggle.addEventListener("click", toggleTheme);

// Add Demo AI Teacher Button
function addDemoAITeacherButton() {
    const statusDiv = document.querySelector(".status");
    if (!statusDiv) return;

    const demoButton = document.createElement("button");
    demoButton.id = "ai-teacher-demo-button";
    demoButton.textContent = "Start Demo";
    demoButton.style.marginLeft = "10px";
    demoButton.onclick = () => {
        startLesson({
            id: "0d838683-d5e9-4603-9e0e-851b164af666",
            title: "Newton's Third Law of Motion",
            subject: "Physics",
            topic: "Newton's Third Law of Motion"
        });
    };
    statusDiv.insertBefore(demoButton, statusDiv.firstChild);
}

// Call button addition after page load
window.addEventListener('load', addDemoAITeacherButton);

// Start Application
async function startApp() {
    authSection.classList.add("hidden");
    await loadDashboard();
}
startApp();
// Upload PDF
const pdfUpload = document.getElementById("pdf-upload");
const uploadBtn = document.getElementById("upload-btn");
const uploadStatus = document.getElementById("upload-status");

uploadBtn.addEventListener("click", async () => {
    const file = pdfUpload.files[0];
    if (!file) return;

    uploadStatus.textContent = "Uploading...";
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`${API_BASE}/api/documents/upload`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        currentDocumentId = data.document_id;
        uploadStatus.textContent = `Uploaded: ${data.filename}`;

        // Infer subject from filename if it looks like a known subject
        const filename = data.filename.toLowerCase();
        let inferredSubject = "";
        if (filename.includes("computer")) inferredSubject = "Computer Science";
        else if (filename.includes("physics")) inferredSubject = "Physics";
        else if (filename.includes("chem")) inferredSubject = "Chemistry";
        else if (filename.includes("math")) inferredSubject = "Mathematics";
        else if (filename.includes("bio")) inferredSubject = "Biology";

        if (inferredSubject) {
            pathSubject.value = inferredSubject;
        }

        // Trigger regeneration of learning path using the new document context and updated subject
        loadLearningPath(pathSubject.value);
    } catch (error) {
        console.error(error);
        uploadStatus.textContent = "Upload failed.";
    }
});

const generatePathButton = document.getElementById("generate-path-button");
const pathSubject = document.getElementById("path-subject");

generatePathButton.addEventListener("click", () => {
    loadLearningPath(pathSubject.value);
});

let latestRequestId = 0;

async function loadLearningPath(subject) {
    const requestId = ++latestRequestId;

    try {
        let url = `${API_BASE}/api/student/learning-path/${STUDENT_ID}`;
        let params = new URLSearchParams();
        if (subject) params.append("subject", subject);
        if (currentDocumentId) params.append("document_id", currentDocumentId);

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) return;

        // Check if this request is still the latest one
        if (requestId !== latestRequestId) return;

        const data = await response.json();
        displayLearningPath(data);
    } catch (error) {
        console.error("Learning path error:", error);
    }
}

function displayLearningPath(data) {
    if (!data.learning_path || data.learning_path.length === 0) {
        learningPathContainer.innerHTML = "<p>No learning path available yet.</p>";
        return;
    }

    learningPathSection.classList.remove("hidden");
    learningPathContainer.innerHTML = data.learning_path.map((lesson, index) => {
        // Now using lesson_id directly from the API
        const lessonId = lesson.lesson_id;

        const buttonHtml = lessonId
            ? `<button onclick='startLesson({id: "${lessonId}"})'>Start Lesson</button>`
            : `<button disabled>No ID Available</button>`;

        return `
        <div class="lesson-item" style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            <p><strong>${index + 1}. ${lesson.title || "Module " + (index + 1)}</strong></p>
            <p><small>${lesson.subject || ""} - ${lesson.topic || ""}</small></p>
            ${buttonHtml}
        </div>
    `;
    }).join("");
}

// Assessment Flow
const assessmentUI = document.getElementById("assessment-ui");
const assessmentQuestions = document.getElementById("assessment-questions");
const submitAssessmentButton = document.getElementById("submit-assessment-button");
const assessmentResultsUI = document.getElementById("assessment-results-ui");
const assessmentResultsContainer = document.getElementById("assessment-results-container");
const startAssessmentButton = document.getElementById("start-assessment-button");

let currentAssessment = null;

if (startAssessmentButton) {
    startAssessmentButton.addEventListener("click", async () => {
        // Hide lesson UI, show assessment UI
        document.querySelector(".lesson-generator").classList.add("hidden");
        document.getElementById("qa-section").classList.add("hidden");
        document.getElementById("media-section").classList.add("hidden");
        assessmentUI.classList.remove("hidden");

        const response = await fetch(`${API_BASE}/api/assessment/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lesson_id: currentLesson.lesson_id,
                student_id: STUDENT_ID,
                subject: currentLesson.subject,
                topic: currentLesson.topic,
                language: getSelectedLanguage()
            })
        });
        currentAssessment = await response.json();
        renderAssessment(currentAssessment.questions);
    });
}

function renderAssessment(questions) {
    assessmentQuestions.innerHTML = questions.map((q, i) => `
        <div class="question-item" data-index="${i}" style="margin-bottom: 20px;">
            <p><strong>${i + 1}. ${escapeHTML(q.question)}</strong></p>
            ${q.question_type === "mcq"
                ? q.options.map(opt => `
                    <label><input type="radio" name="q${i}" value="${opt}"> ${escapeHTML(opt)}</label><br>
                `).join("")
                : `<textarea name="q${i}" style="width: 100%;"></textarea>`
            }
        </div>
    `).join("");
    submitAssessmentButton.classList.remove("hidden");
}

submitAssessmentButton.addEventListener("click", async () => {
    const answers = currentAssessment.questions.map((q, i) => {
        let student_answer = "";
        if (q.question_type === "mcq") {
            const selected = document.querySelector(`input[name="q${i}"]:checked`);
            student_answer = selected ? selected.value : "";
        } else {
            student_answer = document.querySelector(`textarea[name="q${i}"]`).value;
        }
        return {
            question: q.question,
            concept: q.concept,
            student_answer: student_answer,
            correct_answer: q.correct_answer
        };
    });

    const response = await fetch(`${API_BASE}/api/assessment/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            lesson_id: currentLesson.lesson_id,
            student_id: STUDENT_ID,
            subject: currentLesson.subject,
            topic: currentLesson.topic,
            answers: answers
        })
    });
    const result = await response.json();
    renderEvaluation(result);
});

function renderEvaluation(result) {
    assessmentUI.classList.add("hidden");
    assessmentResultsUI.classList.remove("hidden");

    // Result object has 'overall_score', 'status', 'personalized_feedback', 'next_recommendation'
    assessmentResultsContainer.innerHTML = `
        <div class="card">
            <h3>Assessment Complete</h3>
            <p style="font-size: 1.25rem; font-weight: bold;">Score: ${result.overall_score}%</p>
            <p><strong>Status:</strong> ${result.status}</p>

            <div style="margin-top: 15px;">
                <p><strong>Feedback:</strong></p>
                <p>${escapeHTML(result.personalized_feedback)}</p>
            </div>

            ${result.next_recommendation ? `
                <div class="next-step" style="margin-top: 15px; padding: 10px; background: #eef2ff; border-radius: 8px;">
                    <p><strong>Recommended Next Step:</strong> ${result.next_recommendation.topic}</p>
                    <p><small>${result.next_recommendation.reason}</small></p>
                </div>
            ` : ""}

            <button onclick="location.reload()" style="margin-top: 20px;">Back to Dashboard</button>
        </div>
    `;
}


// ============================================================
// TOP NAVIGATION
// UI-only navigation. Existing API, lesson, assessment, auth,
// media, and dashboard logic above remains unchanged.
// ============================================================

(function initializeTopNavigation() {
    const pageSections = {
        home: "home-section",
        "learning-path": "learning-path-view",
        "my-learning": "my-learning-view",
        lesson: "lesson-view",
        "study-material": "study-material-view",
        about: "about-view"
    };

    function showSection(sectionName) {
        const targetId = pageSections[sectionName] || pageSections.home;

        Object.values(pageSections).forEach((id) => {
            const section = document.getElementById(id);
            if (section) {
                section.classList.toggle("hidden", id !== targetId);
            }
        });

        document.querySelectorAll(".nav-item").forEach((item) => {
            const isActive = item.dataset.section === sectionName;
            item.classList.toggle("active", isActive);
            item.setAttribute("aria-current", isActive ? "page" : "false");
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.querySelectorAll(".nav-item").forEach((item) => {
        item.addEventListener("click", () => {
            showSection(item.dataset.section);
        });
    });

    const homeLogo = document.getElementById("home-logo");
    if (homeLogo) {
        homeLogo.addEventListener("click", () => showSection("home"));
        homeLogo.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                showSection("home");
            }
        });
    }

    // Start on Home. Dashboard loading remains controlled by the
    // existing startApp()/loadDashboard() flow.
    showSection("home");
})();
