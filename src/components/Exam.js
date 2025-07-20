import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Webcam from "react-webcam";

export default function Exam() {
  const examRef = useRef(null);

  // 1. Define questions FIRST
  const questions = useMemo(() => [
        {
          questionText: 'What is the capital of France?',
          answerOptions: [
            { answerText: 'New York', isCorrect: false },
            { answerText: 'London', isCorrect: false },
            { answerText: 'Paris', isCorrect: true },
            { answerText: 'Dublin', isCorrect: false },
          ],
        },
        {
          questionText: 'Which planet is known as the Red Planet?',
          answerOptions: [
            { answerText: 'Venus', isCorrect: false },
            { answerText: 'Mars', isCorrect: true },
            { answerText: 'Jupiter', isCorrect: false },
            { answerText: 'Saturn', isCorrect: false },
          ],
        },
        {
          questionText: 'Who wrote "Romeo and Juliet"?',
          answerOptions: [
            { answerText: 'William Wordsworth', isCorrect: false },
            { answerText: 'William Shakespeare', isCorrect: true },
            { answerText: 'John Keats', isCorrect: false },
            { answerText: 'Charles Dickens', isCorrect: false },
          ],
        },
        {
          questionText: 'What is the largest mammal?',
          answerOptions: [
            { answerText: 'Elephant', isCorrect: false },
            { answerText: 'Blue Whale', isCorrect: true },
            { answerText: 'Giraffe', isCorrect: false },
            { answerText: 'Rhino', isCorrect: false },
          ],
        },
        {
          questionText: 'Which element has the chemical symbol O?',
          answerOptions: [
            { answerText: 'Gold', isCorrect: false },
            { answerText: 'Oxygen', isCorrect: true },
            { answerText: 'Osmium', isCorrect: false },
            { answerText: 'Oxide', isCorrect: false },
          ],
        },
        {
          questionText: 'What is the square root of 64?',
          answerOptions: [
            { answerText: '6', isCorrect: false },
            { answerText: '8', isCorrect: true },
            { answerText: '10', isCorrect: false },
            { answerText: '12', isCorrect: false },
          ],
        },
        {
          questionText: 'In which continent is the Sahara Desert located?',
          answerOptions: [
            { answerText: 'Asia', isCorrect: false },
            { answerText: 'Australia', isCorrect: false },
            { answerText: 'Africa', isCorrect: true },
            { answerText: 'South America', isCorrect: false },
          ],
        },
        {
          questionText: 'Which gas do plants absorb from the atmosphere?',
          answerOptions: [
            { answerText: 'Oxygen', isCorrect: false },
            { answerText: 'Carbon Dioxide', isCorrect: true },
            { answerText: 'Nitrogen', isCorrect: false },
            { answerText: 'Hydrogen', isCorrect: false },
          ],
        },
        {
          questionText: 'Who was the first person to walk on the Moon?',
          answerOptions: [
            { answerText: 'Buzz Aldrin', isCorrect: false },
            { answerText: 'Yuri Gagarin', isCorrect: false },
            { answerText: 'Neil Armstrong', isCorrect: true },
            { answerText: 'Michael Collins', isCorrect: false },
          ],
        },
        {
          questionText: 'Which language is primarily spoken in Brazil?',
          answerOptions: [
            { answerText: 'Spanish', isCorrect: false },
            { answerText: 'French', isCorrect: false },
            { answerText: 'Portuguese', isCorrect: true },
            { answerText: 'English', isCorrect: false },
          ],
        },
      ], []);

  // 2. Now you can use questions in your hooks
  const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(null));
  const [score, setScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [headAlert, setHeadAlert] = useState("");
  const webcamRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // Memoized handleSubmit to avoid useEffect warning
  const handleSubmit = useCallback(() => {
        let newScore = 0;
        userAnswers.forEach((ansIdx, qIdx) => {
            if (
                ansIdx !== null &&
                questions[qIdx].answerOptions[ansIdx].isCorrect
            ) {
                newScore += 1;
            }
        });
        setScore(newScore);
        setSubmitted(true);
    }, [userAnswers, questions]);

  const handleStartExam = async () => {
    setRegisterError("");
    setRegistering(true);
    const face = webcamRef.current.getScreenshot();
    if (!face) {
      setRegisterError("Could not capture image from webcam.");
      setRegistering(false);
      return;
    }

    // Convert dataURL to Blob
    const blob = await fetch(face).then(res => res.blob());
    const formData = new FormData();
    formData.append("roll_number", rollNumber);
    formData.append("image", blob, "face.jpg");

    // Register face
    const res = await fetch("http://localhost:5000/register-face", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.status === "registered") {
      if (examRef.current && document.fullscreenEnabled) {
        await examRef.current.requestFullscreen();
      }
      setStarted(true);
    } else if (data.status === "no_face") {
      setRegisterError("No face detected. Please ensure your face is visible and try again.");
    } else if (data.status === "multiple_faces") {
      setRegisterError("Multiple faces detected. Please ensure only you are visible and try again.");
    } else {
      setRegisterError("Face registration failed. Please try again.");
    }
    setRegistering(false);
  };

  // Now useEffect can safely use handleSubmit
  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement && started && !submitted) {
        handleSubmit();
        alert("You exited fullscreen. Exam submitted automatically.");
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [started, submitted, handleSubmit]);

  const rollNumber=localStorage.getItem("rollNumber");

  // Timer logic
  useEffect(() => {
      if (!submitted && timeLeft > 0) {
          const timer = setTimeout(() => {
              setTimeLeft(timeLeft - 1);
          }, 1000);
          return () => clearTimeout(timer);
      }
      if (timeLeft === 0 && !submitted) {
          handleSubmit();
      }
  }, [timeLeft, submitted, handleSubmit]);

  // Head movement detection logic
  useEffect(() => {
      if (!started || submitted) return;
      const interval = setInterval(() => {
          if (webcamRef.current) {
              const imageSrc = webcamRef.current.getScreenshot();
              if (imageSrc) {
                  verifyFaceDuringExam(imageSrc);
                  sendFrameToBackend(imageSrc); // for head movement
                  detectObjectDuringExam(imageSrc); // for object detection
              }
          }
      }, 3000); // every 3 seconds
      return () => clearInterval(interval);
  }, [started, submitted]);

  const verifyFaceDuringExam = async (dataUrl) => {
    const blob = await fetch(dataUrl).then(res => res.blob());
    const formData = new FormData();
    formData.append("roll_number", rollNumber);
    formData.append("image", blob, "frame.jpg");

    const res = await fetch("http://localhost:5000/verify-face", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.status === "mismatch") {
      alert("Face mismatch detected! Exam will be submitted.");
      handleSubmit();
    } else if (data.status === "multiple_faces") {
      alert("Multiple faces detected! Exam will be submitted.");
      handleSubmit();
    }
    // Optionally, handle 'no_face' or 'match' statuses
  };

  const [objectAlertCount, setObjectAlertCount] = useState(0);

const detectObjectDuringExam = async (dataUrl) => {
  const blob = await fetch(dataUrl).then(res => res.blob());
  const formData = new FormData();
  formData.append("image", blob, "frame.jpg");

  const res = await fetch("http://localhost:5000/detect-object", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();

  if (data.status === "forbidden_object") {
    setObjectAlertCount(count => {
      if (count + 1 > 2) {
        alert(`Forbidden object detected multiple times. Exam will be submitted.`);
        handleSubmit();
        return 0;
      }
      return count + 1;
    });
  } else {
    setObjectAlertCount(0);
  }
};

  const sendFrameToBackend = (dataUrl) => {
      fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
              const formData = new FormData();
              formData.append('image', blob, 'frame.jpg');
              fetch("http://localhost:5000/detect-head", {
                  method: "POST",
                  body: formData,
              })
                  .then(res => res.json())
                  .then(data => {
                      setHeadAlert(data.direction);
                      if (data.direction.startsWith("ALERT")) {
                          const alertData = {
                              student_id: rollNumber, // Placeholder for student ID
                              direction: data.direction,
                              time: new Date().toLocaleTimeString()
                          };
                          fetch('http://localhost:5000/log-alert', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(alertData)
                          });
                      }
                  });
          });
  };

  return (
    <div ref={examRef} className="exam-fullscreen">
      <div className="alert alert-warning text-center fw-bold" style={{ fontSize: '1.3rem', marginBottom: 20 }}>
        Do not exit fullscreen mode. You are being monitored by AI proctoring.
      </div>
      <h1 className="text-center mb-4">Exam</h1>
      {!started ? (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{height: '70vh'}}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
            className="mb-4 border border-dark rounded"
          />
          {registerError && (
            <div className="alert alert-danger mb-3">{registerError}</div>
          )}
          <button className="btn btn-primary" onClick={handleStartExam} disabled={registering}>
            {registering ? "Registering..." : "Start Exam"}
          </button>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="row">
            {/* Left: Questions */}
            <div className="col-md-8 col-12" style={{maxHeight: '85vh', overflowY: 'auto', borderRight: '2px solid #eee', background: 'white', zIndex: 10, position: 'relative'}}>
              <h4>Time Left: {timeLeft} seconds</h4>
              {!submitted ? (
                <>
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="mb-4 p-3 border rounded">
                      <h5>{q.questionText}</h5>
                      {q.answerOptions.map((option, oIdx) => (
                        <div key={oIdx}>
                          <input
                            type="radio"
                            id={`q${qIdx}-o${oIdx}`}
                            name={`question-${qIdx}`}
                            value={oIdx}
                            checked={userAnswers[qIdx] === oIdx}
                            onChange={() => {
                              const updated = [...userAnswers];
                              updated[qIdx] = oIdx;
                              setUserAnswers(updated);
                            }}
                          />
                          <label htmlFor={`q${qIdx}-o${oIdx}`}>{option.answerText}</label>
                        </div>
                      ))}
                    </div>
                  ))}
                  <button className="btn btn-primary mt-3" onClick={handleSubmit}>
                    Submit Exam
                  </button>
                </>
              ) : (
                <div className="p-4">
                  <h2>Your score: {score} / {questions.length}</h2>
                </div>
              )}
            </div>
            {/* Right: Webcam and Alerts */}
            <div className="col-md-4 col-12 d-flex flex-column align-items-center justify-content-start" style={{position: 'relative', minHeight: '85vh', zIndex: 1}}>
              <div className="sticky-top" style={{top: 30}}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={320}
                  height={240}
                  className="mb-4 border border-dark rounded"
                />
                {headAlert && (
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: headAlert.startsWith("ALERT") ? "red" : "green", textAlign: 'center', marginTop: 20 }}>
                    {headAlert}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}