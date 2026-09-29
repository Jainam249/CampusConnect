import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    course: "",
    semester: "",
  });

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchStudents = async () => {
    try {
      setError("");

      const response = await fetch(`${API_BASE_URL}/students`);

      if (!response.ok) {
        throw new Error("Unable to load students.");
      }

      const data = await response.json();
      setStudents(data);
    } catch (error) {
      setError(error.message || "Unable to load students.");
    }
  };

  useEffect(() => {
    const loadStudents = async () => {
      await fetchStudents();
      setLoading(false);
    };

    loadStudents();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.course.trim() ||
      !formData.semester
    ) {
      setFormError("All fields are required.");
      return;
    }

    const semesterNumber = Number(formData.semester);

    if (!Number.isInteger(semesterNumber) || semesterNumber < 1) {
      setFormError("Semester must be a positive integer.");
      return;
    }

    try {
      const url = editingId
        ? `${API_BASE_URL}/students/${editingId}`
        : `${API_BASE_URL}/students`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          course: formData.course.trim(),
          semester: semesterNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(data.error || "Invalid student data.");
        }

        if (response.status === 404) {
          throw new Error("Student not found.");
        }

        throw new Error(
          editingId ? "Failed to update student." : "Failed to add student.",
        );
      }

      if (editingId) {
        setStudents((currentStudents) =>
          currentStudents.map((student) =>
            student._id === editingId ? data : student,
          ),
        );

        setSuccessMessage("Student updated successfully.");
      } else {
        setStudents((currentStudents) => [...currentStudents, data]);

        setSuccessMessage("Student added successfully.");
      }

      setFormData({
        name: "",
        email: "",
        course: "",
        semester: "",
      });

      setEditingId(null);
    } catch (error) {
      setFormError(
        error.message ||
          (editingId ? "Failed to update student." : "Failed to add student."),
      );
    }
  };

  const handleEdit = (student) => {
    setFormData({
      name: student.name,
      email: student.email,
      course: student.course,
      semester: student.semester.toString(),
    });

    setEditingId(student._id);
    setFormError("");
    setSuccessMessage("");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?",
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: "DELETE",
      });

      if (response.status === 404) {
        throw new Error("Student not found.");
      }

      if (!response.ok) {
        throw new Error("Failed to delete student.");
      }

      setStudents((currentStudents) =>
        currentStudents.filter((student) => student._id !== id),
      );

      setSuccessMessage("Student deleted successfully.");
    } catch (error) {
      setError(error.message || "Failed to delete student.");
    }
  };

  return (
    <div className="app">
      <h1>CampusConnect Student Management</h1>
      <p className="subtitle">React Client — Lab 4</p>

      <div className="content">
        <h2>{editingId ? "Edit Student" : "Add Student"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter student name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
            />
          </div>

          <div className="form-group">
            <label>Course</label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleChange}
              placeholder="Enter course"
            />
          </div>

          <div className="form-group">
            <label>Semester</label>
            <input
              type="number"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              placeholder="Enter semester"
            />
          </div>

          {formError && <p className="error">{formError}</p>}

          {successMessage && <p className="success">{successMessage}</p>}

          <button type="submit">
            {editingId ? "Update Student" : "Add Student"}
          </button>
        </form>
      </div>

      <div className="content students-section">
        <h2>Students</h2>

        {loading && <p>Loading students...</p>}

        {error && <p className="error">{error}</p>}

        {!loading && !error && students.length === 0 && (
          <p>No students found.</p>
        )}

        {!loading && !error && students.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Semester</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.course}</td>
                  <td>{student.semester}</td>
                  <td>
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(student)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-button"
                      onClick={() => handleDelete(student._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
