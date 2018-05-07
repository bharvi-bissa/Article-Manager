$(document).ready(function(){
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