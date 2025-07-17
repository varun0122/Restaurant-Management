import React, { useState } from 'react';

const Feedback = () => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    alert("Thank you for your feedback!");
    setFeedback('');
  };

  return (
    <div className="container mt-4">
      <h4>Leave a Review</h4>
      <textarea
        className="form-control mt-3"
        rows="4"
        placeholder="Write your feedback here..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <button className="btn btn-success mt-3" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
};

export default Feedback;
