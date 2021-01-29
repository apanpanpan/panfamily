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
  i.style="width: 85%; display: inline"

  var upload = document.createElement("input");
  upload.type = "file";
  upload.accept = "image/*"
  upload.className = "form-control";
  upload.name = "uploadedPhoto";
  upload.id = `uploadedPhoto${count}`;
  upload.onchange = function(closureCount) {
    uploadPhoto(closureCount);
  }.bind(this, count);
  upload.style = "display: none;"

  var uploadButton = document.createElement("input");
  uploadButton.type = "button";
  uploadButton.value="Browse...";
  uploadButton.className = "btn";
  uploadButton.onclick = function(closureCount) {
    document.getElementById(`uploadedPhoto${closureCount}`).click();
  }.bind(this, count)

  var img = document.createElement("img");
  img.id = `imageURLPreview${count}`;
  img.className = "hide-preview-img";

  $("#photos-group").append(i);
  $("#photos-group").append(upload);
  $("#photos-group").append(uploadButton);
  $("#photos-group").append(img);
}

function uploadPhoto(id) {
  var $files = document.getElementById(`uploadedPhoto${id}`).files;

  if ($files.length) {
    // Reject big files
    // if ($files[0].size > $(this).data('max-size') * 1024) {
    //   console.log('Please select a smaller file');
    //   return false;
    // }

    // Begin file upload
    console.log('Uploading file to Imgur..');

    var apiUrl = 'https://api.imgur.com/3/image';
    var apiKey = '48de3088ecf74ed'; //client id

    var settings = {
      async: false,
      crossDomain: true,
      processData: false,
      contentType: false,
      type: 'POST',
      url: apiUrl,
      headers: {
        Authorization: 'Client-ID ' + apiKey,
        Accept: 'application/json',
      },
      mimeType: 'multipart/form-data',
    };

    var formData = new FormData();
    formData.append('image', $files[0]);
    settings.data = formData;

    // Response contains stringified JSON
    // Image URL available at response.data.link
    $.ajax(settings).done(function (response) {
      var urlInput = document.getElementById(`imageURL${id}`);
      var preview = document.getElementById(`imageURLPreview${id}`);
      var link = JSON.parse(response).data.link;
      urlInput.value = link;
      preview.className = "show-preview-img";
      preview.src = link;
    });
  }
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
