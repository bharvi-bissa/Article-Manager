$(document).ready(function(){
  $('.modal').modal();
  $('.delete-article').on('click',function(e){
    e.preventDefault();
    $target = $(e.target);
    const id = $target.attr('data-id');
    $.ajax({
      type : 'DELETE',
      url : '/article/delete/'+id,
      success : function(response){
        alert('deleting Article');
        window.location.href='/';
      },
      error : function(err){
        console.log(err);
      }
    });
  });
});

// document.getElementById("file").onchange = function () {
//   var reader = new FileReader();

//   reader.onload = function (e) {
//       // get loaded data and render thumbnail.
//       document.getElementById("image").src = e.target.result;
//       document.getElementById("image").style.height="100px";
//       document.getElementById("image").style.width="100px";

//   };

//   // read the image file as a data URL.
//   reader.readAsDataURL(this.files[0]);
// };

