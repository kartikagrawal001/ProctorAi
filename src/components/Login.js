import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login(){
    const [username, setUsername] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate=useNavigate();
    
    const handleSubmit = (e) => {
        e.preventDefault();

        const loginData = {
            username,
            rollNumber,
            password
          };
            fetch("http://127.0.0.1:5000/login"
                ,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(loginData)
            })
              .then(res => res.json())
              .then(data => {
                if(data.message==="Login successful"){
                    localStorage.setItem("rollNumber",rollNumber);
                    navigate("/instruction");
                    alert("Login successful")
                }else{
                    alert("Invalid Credentials");
                }
              }).catch(err => {
                console.error("Error fetching data:", err);
          });      
    
    };

    
    return(
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <div className="card p-4 shadow" style={{ maxWidth: "400px", width: "100%" }}>
                <h1 className="text-center mb-4">Student Login</h1>
                <form onSubmit={handleSubmit}>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Roll Number</label>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Roll Number"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Login</button>
                </form>
            </div>
        </div>
    )
};