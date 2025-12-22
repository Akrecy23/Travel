// FUNCTION FOR ADDING COLLABORATORS DOCUMENT
async function addCollaborators(email, emailInput, card) {
  if (email) {
      // Call your function to handle sending
      sendCollaboratorInvite(email, card.dataset.trip);
      // Clear and hide form
      emailInput.value = "";
      card.querySelector(".collaborator-form").classList.add("hidden");
    } else {
      alert("Please enter a valid email.");
    }
}
