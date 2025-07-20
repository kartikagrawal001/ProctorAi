import React from "react";
import { useNavigate } from "react-router-dom";

export default function Instruction() {
    const [checked, setChecked] = React.useState(false);
    const instructions = [
        "Keep your webcam on at all times during the exam.",
        "Do not refresh or close the browser tab while the exam is in progress.",
        "Do not open any other tabs, windows, or applications during the exam.",
        "Ensure you have a stable internet connection.",
        "No use of mobile phones or other electronic devices is allowed.",
        "You must remain visible in front of the webcam for during the exam.",
        "Any suspicious activity may result in disqualification.",
        "Do not share your screen with anyone.",
        "Do not Exit FullScreen Mode it will leads to disqualification.",
        'Click the "Start Exam" button below when you are ready.',
        "If you face any technical issues, contact the exam supervisor immediately."
    ];
    const navigate = useNavigate();

    return (
        <div className="container mt-5 d-flex justify-content-center">
            <div className="card" style={{ maxWidth: "600px", width: "100%" }}>
                <div className="card-body">
                    <h3 className="card-title mb-3 text-center">Exam Instructions</h3>
                    <ol className="instruction-list">
                        {instructions.map((instruction, index) => (
                            <li key={index} className="d-flex mb-2">
                                <span className="instruction-number me-2">{index + 1}.</span>
                                <span>{instruction}</span>
                            </li>
                        ))}
                    </ol>
                    <div className="form-check my-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="acknowledge"
                            checked={checked}
                            onChange={() => setChecked(!checked)}
                        />
                        <label className="form-check-label" htmlFor="acknowledge">
                            I have read and understood all the instructions above.
                        </label>
                    </div>
                    <button
                        className="btn btn-primary mt-3 w-100"
                        onClick={() => navigate("/exam")}
                        disabled={!checked}
                    >
                        Start Exam
                    </button>
                </div>
            </div>
        </div>
    );
}