var array = [];
document.addEventListener("keydown", event => {
  const keyPressed = String.fromCharCode(event.keyCode);
  const keyElement = document.getElementById(keyPressed);
  const highlightedKey = document.querySelector(".selected");
  
  switch (event.keyCode) {
    case 38:
      if (array.toString() == "&" || array.toString() == "") {
        array.push("&");
      }
      else {
        clear();
      }
      break;
    case 40:
      if (array.toString() == "&,&" || array.toString() == "&,&,(") {
        array.push("(");
      }
      else {
        clear();
      }
      break;
    case 37:
      if (array.toString() == "&,&,(,(" || array.toString() == "&,&,(,(,%,'") {
        array.push("%");
      }
      else {
        clear();
      }
      break;
    case 39:
      if (array.toString() == "&,&,(,(,%" || array.toString() == "&,&,(,(,%,',%") {
        array.push("'");
      }
      else {
        clear();
      }
      break;
    case 66:
      if (array.toString() == "&,&,(,(,%,',%,'") {
        array.push("B");
      }
      else {
        clear();
      }
      break;
    case 65:
      if (array.toString() == "&,&,(,(,%,',%,',B") {
        array.push("A");
        window.location = ("https://www.konami.com/en/");
      }
      break;
  }/* u there? */
})

function clear() {
  array = [];
}