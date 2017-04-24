'use strict'
//One
//I got output 0-9 number
// for (var i = 0; i < 10; i++) {
//     console.log(i);
// }

//Two
//When I set timeout for 0 ms then I got out put 10 for 10 times
//Loop to 10 baar gumti hai
//Javascript : simply single threaded
// pahele wo ak thread pe karne vale har ek kaam karega , jo timeout or koe bhi process hai use stack par laga k rakhega
//For loop gumte time copy to hota rehta hai matlab jab loop 10 v baar gumti hai tab "i" ki letest value aati hai to 10 baar 10 print hota hai
// for (var i = 0; i < 10; i++) {
//   //First execute this thing
//   console.log("Loop " + i);
//   //Second execute timeout thing
//   setTimeout(function () {
//     console.log(i);
//   }, 0);
// }
// Actully This way is wrong

//Three
for (let i = 0; i < 10; i++) {

  console.log("Loop " + i);
  //Imidiately invoke function
  //both "i" are different
  //jitni baar function call hoga utni baar nae copy banti hai
  (function (i) {
    //Async call , sab kuch ak sequence me khatam karta hai
    process.nextTick(function () { // Async Call
      console.log(i);
    }, 0);
  })(i);
}

//If I have 2 function
//Dono k bich me same value hai
// function 1 : sync call hota hai , function 2 : Async call hota hai
//function 2 me function 1 ki value milti hai

//ak config var bahar banayanlog ( banayanlog = var config )
//Configure pahele call ho jata hai
//We have to use node drawback as lazy configration
