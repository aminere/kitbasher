module.exports = function (config) {
	
    if (!config) {
        config = 'dev';
    }  
      
    console.log(`config: ${config}`);
    return require(`./webpack.${config}.js`)
  }
  