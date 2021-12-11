const array = [];
document.addEventListener("keydown", event => {
  const keyPressed = String.fromCharCode(event.keyCode);
  const keyElement = document.getElementById(keyPressed);
  const highlightedKey = document.querySelector(".selected");
  console.log(event.keyCode);
    if (event.keyCode == 38) {
      array.push("&");
      console.log("key recognized");
    }  
  console.log(array);
  console.log(keyPressed);
})