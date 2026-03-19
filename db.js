const mongoose = require('mongoose');


async function getDatabase(){
    
    mongoose.connect('mongodb+srv://test123:test123@cluster0.rpxotyf.mongodb.net/').then(() => {
      
//=================>   santhosh = username , man3test = password      <=============================//

    // for eg : san@sum  ====>  this "@" is not understood by atlas  so we need to encode that like "%40"   [or]     +encodedURIComponent('san@sum')+
    
    
       console.log('Database connected');
    }).catch(() => {
        console.log('Database not connected');
    })
}

module.exports = {
    getDatabase,
}