function addIngredient() {
  var i = document.createElement("input");
  i.type = "text";
  i.className = "form-control";
  i.name = "ingredients";
  i.id = "ingredients";
  i.placeholder = "Chicken"

  $("#ingredients-group").append(i);
}

function addInstruction() {
  var i = document.createElement("input");
  i.type = "text";
  i.className = "form-control";
  i.name = "instructions";
  i.id = "instructions";
  i.placeholder = "Season salmon with salt and pepper"

  $("#instructions-group").append(i);
}

function imagePreview() {
  var preview = document.getElementById("imageURLPreview");
  var text = document.getElementById("imageURL");
  if (text.value != "") {
    preview.className = "show-preview-img"
  } else {
    preview.className = "hide-preview-img"
  }
  preview.src = text.value
}

$('select').selectpicker();
