let loadingInterval = null;

const loading = () => {
    var h = ['|', '/', '-', '\\'];
    var i = 0;
  
    loadingInterval = setInterval(() => {
      i = (i > 3) ? 0 : i;
      console.clear();
      console.log(`Getting data... ${h[i]}`);
      i++;
    }, 100);
};

const stopLoading = () => {
    clearInterval(loadingInterval);
}
  
module.exports = { loading, stopLoading };