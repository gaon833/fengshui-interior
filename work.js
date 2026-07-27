let activeSize='all';
function applyFilters(){
  document.querySelectorAll('.work-tile').forEach(tile=>{
    tile.classList.toggle('is-hidden', !(activeSize==='all'||tile.dataset.size===activeSize));
  });
}
document.querySelectorAll('[data-size-filter]').forEach(button=>{
  button.addEventListener('click',()=>{
    activeSize=button.dataset.sizeFilter;
    document.querySelectorAll('[data-size-filter]').forEach(item=>item.classList.remove('active'));
    button.classList.add('active');
    applyFilters();
  });
});