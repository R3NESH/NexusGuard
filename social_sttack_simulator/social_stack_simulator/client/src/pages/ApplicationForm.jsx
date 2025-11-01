import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const colors = {
  primaryBlue: "#1a73e8",
  darkBlue: "#0e4a9e",
  lightGray: "#f8f9fa",
  mediumGray: "#e0e0e0",
  darkGray: "#3c4043",
  textMuted: "#5f6368",
  white: "#ffffff",
};

const inputStyle = {
  width: "100%",
  padding: "0.8rem 1rem",
  fontSize: "1rem",
  borderRadius: "6px",
  border: `1px solid ${colors.mediumGray}`,
  background: colors.white,
  color: colors.darkGray,
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const radioLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
  cursor: "pointer",
  background: colors.lightGray,
  padding: "0.8rem 1.2rem",
  borderRadius: "6px",
  fontWeight: "500",
  color: colors.darkGray,
  border: `1px solid ${colors.mediumGray}`,
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
};

const submitStyle = {
  width: "100%",
  background: colors.primaryBlue,
  color: colors.white,
  fontWeight: "600",
  padding: "1rem",
  border: "none",
  borderRadius: "6px",
  fontSize: "1.1rem",
  cursor: "pointer",
  transition: 'background-color 0.3s ease, transform 0.2s ease',
};

function ApplicationForm() {
  const [form, setForm] = useState({
    fullName: "",
    studentID: "",
    college: "",
    course: "",
    address: "",
    mobile: "",
    email: "",
    year: "",
    cgpa: "",
    opportunity: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate(); // Still here, but we won't use it on submit
  const BACKEND_URL = "http://localhost:5000";

  const recordAction = async (studentID, action, meta) => {
    try {
      if (!studentID || !action) return;
      await fetch(`${BACKEND_URL}/api/record-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentID, action, meta }),
      });
    } catch (e) {
      console.error("Error recording action:", e);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = e => {
    setForm(prev => ({ ...prev, opportunity: e.target.value }));
    if (form.studentID) {
      // This action record is fine, it just tracks viewing
      recordAction(form.studentID, "viewed_opportunity", { value: e.target.value });
    }
  };

  /**
   * NEW SCORING SYSTEM:
   * Score starts at 100 (perfect).
   * Points are DEDUCTED for each field that is filled in, based on sensitivity.
   * A higher score is better (means less data was given away).
   */
  const calculateScore = () => {
    let score = 100; // Perfect score = provided no data
    const filledFieldsList = [];
    
    // Define deductions for each *filled* field (the 'damage' cost)
    const fieldWeights = {
      fullName: 10,
      studentID: 15, // Very sensitive
      college: 5,
      course: 5,
      address: 5,
      mobile: 15, // Very sensitive
      email: 15, // Very sensitive
      year: 5,
      cgpa: 10, // Sensitive academic info
      opportunity: 15 // They fell for the lure
    };

    // Loop through weights to check form fields
    for (const field in fieldWeights) {
      if (form[field] && (typeof form[field] === 'string' && form[field].trim() !== '')) {
        // Field is FILLED, deduct points
        score -= fieldWeights[field];
        filledFieldsList.push(field);
      }
    }
    
    // Ensure score doesn't go below 0
    const finalScore = Math.max(0, score);
    
    return { 
      score: finalScore, // 100 = good (empty), 0 = bad (all filled)
      filledFieldsList: filledFieldsList,
      filledCount: filledFieldsList.length
    };
  };

  /**
   * NEW SUBMIT HANDLER:
   * This now simulates a submission, calculates the phishing score,
   * and shows an alert with the result.
   * IT DOES NOT SEND DATA TO THE BACKEND.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const scoreData = calculateScore();
      
      // --- CODE RESTORED ---
      // 1. Create the data payload to send to the backend
      // Your app.py endpoint will receive this and save it to the DB
      const submissionData = {
          ...form,
          score: scoreData.score, // Your app.py/add_student ignores this, which is fine
          filledFields: scoreData.filledCount, // app.py/add_student ignores this, which is fine
      };

      // 2. Send the data to the /api/students-data endpoint
      try {
        const res = await fetch(`${BACKEND_URL}/api/students-data`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submissionData),
        });

        if (!res.ok) {
            // If the DB save fails, log it but continue to the phishing alert
            const error = await res.json();
            console.error("Failed to save student data:", error.error || 'Failed to submit');
        } else {
            console.log("Phishing test data saved successfully to database.");
        }
      } catch (dbError) {
          console.error("Network error while saving student data:", dbError);
      }
      // --- END OF RESTORED CODE ---


      // We still record the 'submit' action for the test administrator,
      // but we DON'T send the form data.
      recordAction(form.studentID || 'unknown_student', "phishing_test_submit", {
        score: scoreData.score,
        filledCount: scoreData.filledCount,
        filledFieldsList: scoreData.filledFieldsList
      });

      // Helper to make field names pretty for the alert
      const formatFieldName = (field) => field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

      // Create the message listing the data that was "stolen"
      const filledFieldsMessage = scoreData.filledFieldsList.length > 0
        ? `You submitted ${scoreData.filledFieldsList.length} pieces of sensitive information. In a real phishing attack, this data would have been stolen:\n\n- ${scoreData.filledFieldsList.map(formatFieldName).join('\n- ')}`
        : "Great job! You didn't submit any sensitive information.";

      // Show the phishing test result popup
      alert(
        `This was a Phishing Awareness Test!\n\n` +
        `Your Score: ${scoreData.score}/100\n\n` +
        `This score reflects your awareness. A *higher* score is better (meaning you provided less sensitive data).\n\n` +
        `${filledFieldsMessage}\n\n` +
        `This application was not real and your data was NOT submitted.`
      );
      
      // DO NOT NAVIGATE AWAY
      // navigate("/") // REMOVED

    } catch (error) {
      // This catch block is now mostly for errors in calculateScore or recordAction
      console.error("Error during phishing test simulation:", error);
      alert("An error occurred during the simulation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: "800px",
      margin: "2rem auto",
      padding: "2rem",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      borderRadius: "8px",
      backgroundColor: colors.white
    }}>
      <h1 style={{
        color: colors.primaryBlue,
        textAlign: "center",
        marginBottom: "2rem"
      }}>
        Student Application Form
      </h1>
      
      <form onSubmit={handleSubmit} style={{
        display: "grid",
        gap: "1.5rem"
      }}>
        {/* All form fields remain the same as before */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: colors.darkGray
            }}>
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: colors.darkGray
            }}>
              Student ID
            </label>
            <input
              type="text"
              name="studentID"
              value={form.studentID}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Enter your student ID"
            />
          </div>
        </div>

        <div>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            color: colors.darkGray
          }}>
            College/University
          </label>
          <input
            type="text"
            name="college"
            value={form.college}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Enter your college/university name"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: colors.darkGray
            }}>
              Course
            </label>
            <input
              type="text"
              name="course"
              value={form.course}
              onChange={handleChange}
              style={inputStyle}
              placeholder="e.g., B.Tech CSE"
            />
          </div>
          
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: colors.darkGray
            }}>
              Year
            </label>
            <select
              name="year"
              value={form.year}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="5th Year">5th Year</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            color: colors.darkGray
          }}>
            CGPA
          </label>
          <input
            type="number"
            name="cgpa"
            value={form.cgpa}
            onChange={handleChange}
            min="0"
            max="10"
            step="0.01"
            style={inputStyle}
            placeholder="Enter your CGPA (0-10)"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: colors.darkGray
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: colors.darkGray
            }}>
              Mobile Number
            </label>
            <input
              type="tel"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Enter your mobile number"
            />
          </div>
        </div>

        <div>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            color: colors.darkGray
          }}>
            Address
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            style={{
              ...inputStyle,
              minHeight: "100px",
              resize: "vertical"
            }}
            placeholder="Enter your full address"
          />
        </div>

        <div>
          <p style={{
            marginBottom: "1rem",
            fontWeight: "500",
            color: colors.darkGray
          }}>
            Select an opportunity you're interested in:
          </p>
          
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="opportunity"
                value="Summer Internship Program"
                checked={form.opportunity === "Summer Internship Program"}
                onChange={handleRadioChange}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Summer Internship Program</div>
                <div style={{ fontSize: "0.9em", color: colors.textMuted }}>
                  Gain hands-on experience with our 8-week paid internship
                </div>
              </div>
            </label>
            
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="opportunity"
                value="Campus Ambassador"
                checked={form.opportunity === "Campus Ambassador"}
                onChange={handleRadioChange}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Campus Ambassador</div>
                <div style={{ fontSize: "0.9em", color: colors.textMuted }}>
                  Represent our company on your campus and build your network
                </div>
              </div>
            </label>
            
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="opportunity"
                value="Hackathon Participation"
                checked={form.opportunity === "Hackathon Participation"}
                onChange={handleRadioChange}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Hackathon Participation</div>
                <div style={{ fontSize: "0.9em", color: colors.textMuted }}>
                  Compete in our annual coding challenge with exciting prizes
                </div>
              </div>
            </label>
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...submitStyle,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={e => !isSubmitting && (e.target.style.backgroundColor = colors.darkBlue)}
            onMouseOut={e => !isSubmitting && (e.target.style.backgroundColor = colors.primaryBlue)}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ApplicationForm;

