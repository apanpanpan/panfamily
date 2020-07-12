function addIngredient() {
  var i = document.createElement("input");
  i.type = "text";
  i.className = "form-control";
  i.name = "ingredients";
  i.id = "ingredients";
  i.placeholder = "Chicken"

  $("#ingredients-group").append(i);
}

function addVideoUrl() {
  var i = document.createElement("input");
  i.type = "text";
  i.className = "form-control";
  i.name = "videourl";
  i.id = "videourl";
  i.placeholder = "youtube.com/hi"

  $("#video-group").append(i);
}

function addPhoto() {
  count++
  var i = document.createElement("input");
  i.type = "text";
  i.className = "form-control";
  i.name = "url";
  i.id = `imageURL${count}`;
  i.placeholder = "photos.google.com/hi"
  i.onkeyup = function(closureCount) {
    imagePreview(closureCount);
  }.bind(this, count)

  var img = document.createElement("img");
  img.id = `imageURLPreview${count}`;
  img.className = "hide-preview-img";

  $("#photos-group").append(i);
  $("#photos-group").append(img);
}

function imagePreview(id) {
  var preview = document.getElementById(`imageURLPreview${id}`);
  var text = document.getElementById(`imageURL${id}`);
  if (text.value != "") {
    preview.className = "show-preview-img"
  } else {
    preview.className = "hide-preview-img"
  }
  preview.src = text.value
}

function submitForm() {
  var markupStr = $('#summernote').summernote('code');
  if (markupStr == "<p><br></p>") {
    markupStr=null
  }
  var input = document.getElementById("instructions");
  input.value = markupStr
  document.getElementById("hiddenSubmit").click();
}

$('select').selectpicker();
