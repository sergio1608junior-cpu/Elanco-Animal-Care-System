      <!-- FORM VALIDATION LOGIC -->
	function handleFormSubmit(event) {
      event.preventDefault();
      const feedback = document.getElementById('form-feedback');
      const location = document.getElementById('sighting-location').value.trim();
      const species = document.getElementById('sighting-species').value;

      feedback.style.display = "block";

      // Error validation example
      if (!location) {
        feedback.className = "feedback-error";
        feedback.innerHTML = '<i class="fas fa-circle-exclamation"></i> Error: Please specify a valid UK location.';
        return;
      }

      // Warning validation example
      if (species === "Unknown") {
        feedback.className = "feedback-warning";
        feedback.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Warning: Species submitted as "Unknown". Report recorded for analysis.';
        return;
      }

      // Success
      feedback.className = "feedback-success";
      feedback.innerHTML = '<i class="fas fa-circle-check"></i> Success: Sighting submitted successfully!';
      document.getElementById('sightingForm').reset();
    }
