import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function ProctorDashboard() {
  const [alerts, setAlerts] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('http://localhost:5000/alerts')
      .then(res => res.json())
      .then(data => setAlerts(data));
  }, []);

  const alertBarData = Object.entries(alerts).map(([student, logs]) => ({
    student,
    alerts: logs.filter(a => a.direction.startsWith("ALERT")).length
  }));

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Proctor Dashboard</h1>
      <div className="mb-5">
        <h4>Alerts per Student</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={alertBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="student" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="alerts" fill="#dc3545" name="Alert Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-4">
        <h4>Alert Summary</h4>
        <ul>
          {Object.entries(alerts).map(([student, logs]) => {
            const alertCount = logs.filter(a => a.direction.startsWith("ALERT")).length;
            return (
              <li key={student}>
                <b>{student}:</b> {alertCount} alert(s)
              </li>
            );
          })}
        </ul>
      </div>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by student"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Student</th>
            <th>Time</th>
            <th>Alert</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(alerts)
            .filter(([student]) => student.toLowerCase().includes(search.toLowerCase()))
            .flatMap(([student, logs]) =>
              logs.map((alert, idx) => (
                <tr key={student + idx}>
                  <td>{student}</td>
                  <td>{alert.time}</td>
                  <td style={{color: alert.direction.startsWith("ALERT") ? "red" : "green", fontWeight: alert.direction.startsWith("ALERT") ? "bold" : "normal"}}>
                    {alert.direction}
                  </td>
                </tr>
              ))
            )}
        </tbody>
      </table>
    </div>
  );
}
