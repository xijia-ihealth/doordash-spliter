let page = document.getElementById("buttonDiv");

// Reacts to a button click by marking marking the selected button and saving
// the selection
function handleButtonClick(event) {
  // Remove styling from the previously selected color
  alert("abc")
}

// Add a button to the page for each supplied color
function constructOptions() {
  let button = document.createElement("button");
  button.addEventListener("click", handleButtonClick);
  page.appendChild(button);
}

// Initialize the page by constructing the color options
constructOptions();
