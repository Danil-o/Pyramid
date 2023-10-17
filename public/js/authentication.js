const loginText = document.querySelector(".title-text .login");
const loginForm = document.querySelector("form.login");
const loginBtn = document.querySelector("label.login");
const signupBtn = document.querySelector("label.signup");
const signupLink = document.querySelector("form .signup-link a");

signupBtn.onclick = (()=>{
    loginForm.style.marginLeft = "-50%";
    loginText.style.marginLeft = "-50%";
});
loginBtn.onclick = (()=>{
    loginForm.style.marginLeft = "0%";
    loginText.style.marginLeft = "0%";
});
signupLink.onclick = (()=>{
    signupBtn.click();
    return false;
});

// validation input register
let signup_btn = document.querySelector('#signup-btn');
let password= document.querySelector('#password');
let email= document.querySelector('#email');
let confirm= document.querySelector('#confirm-password');
let error_confirm=document.querySelector('#error-confirm');
let error_mail=document.querySelector('#email-error');
let error_password=document.querySelector('#error-password');
//

confirm.addEventListener("input",checkValidetionPassword);
email.addEventListener("blur",checkValidetionEmail);
password.addEventListener("blur",checkValidetionpass);

function checkValidetionpass(){
    let passVal= password.value;
    if (passVal ==''){
        error_password.innerHTML="کلمه عبور اجباری است ";
        signup_btn.setAttribute('disabled','disabled')
        signup_btn.style.background="orange"
        return false
    }
    if(passVal.length < 8 ){
        error_password.innerHTML="کلمه عبور حداقل هشت کارکتر باشد";
        signup_btn.setAttribute('disabled','disabled')
        signup_btn.style.background="orange"
        return false
    }
    else  {
        error_password.innerHTML="";
        signup_btn.removeAttribute('disabled');
        signup_btn.style.background='#219f45';
        return true
    }

}

function checkValidetionEmail(){
   let valMail= email.value;
   if (valMail==''){
       error_mail.innerHTML="لطفا یک ایمیل معتبر وارد کنید";
       signup_btn.setAttribute('disabled','disabled');
       signup_btn.style.background="orange"
       return false;
   }
    var pattern = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (pattern.test(valMail) === false){
        signup_btn.setAttribute('disabled','disabled')
        signup_btn.style.background="orange"
        error_mail.innerHTML="لطفا یک ایمیل معتبر وارد کنید";
        return false;
    }
   else {
       error_mail.innerHTML="";
        signup_btn.removeAttribute('disabled')
        signup_btn.style.background='#219f45';
       return  true
   }
}

function checkValidetionPassword(){
     let valPass=password.value;
     let valConfirm=confirm.value;
     if (valPass!==valConfirm){
         signup_btn.setAttribute('disabled','disabled')
        error_confirm.innerHTML="کلمه عبور با تکرار آن مطابقت ندارد";
         signup_btn.style.background="orange"
        return false
     }
     else {
         error_confirm.innerHTML="";
         signup_btn.removeAttribute('disabled')
         signup_btn.style.background='#219f45';
         return  true
     }

 }
// how alert error
let alert=document.querySelector('.alert');
let alertBtn= document.querySelector('.alert-btn');
if (alertBtn){
    alertBtn.addEventListener('click',()=>{
        alert.style.display="none";
    })
}

let user_name= document.querySelector('#user_name');
let user_pass= document.querySelector('#user_password');
let login_btn= document.querySelector('#login-btn');
let error_login_password= document.querySelector('#error_login_password');
let error_login_email= document.querySelector('#error_login_email');

user_pass.addEventListener('input',checkPassLogin);
user_name.addEventListener('input',checkEmailLogin);

function checkPassLogin(){
    let passVal= user_pass.value;
    if (passVal ===''){
        error_login_password.innerHTML="کلمه عبور اجباری است ";
        login_btn.setAttribute('disabled','disabled')
        login_btn.style.background="orange"
        return false
    }
    if(passVal.length < 8 ){
        error_login_password.innerHTML="کلمه عبور حداقل هشت کارکتر باشد";
        login_btn.setAttribute('disabled','disabled')
        login_btn.style.background="orange"
        return false
    }
    else  {
        error_login_password.innerHTML="";
        login_btn.removeAttribute('disabled');
        login_btn.style.background='#219f45';
        return true
    }
}

function checkEmailLogin(){
    let valMail= user_name.value;
    if (valMail==''){
        error_login_email.innerHTML="لطفا یک ایمیل معتبر وارد کنید";
        login_btn.setAttribute('disabled','disabled');
        login_btn.style.background="orange"
        return false;
    }
    var pattern = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (pattern.test(valMail) === false){
        login_btn.setAttribute('disabled','disabled')
        login_btn.style.background="orange"
        error_login_email.innerHTML="لطفا یک ایمیل معتبر وارد کنید";
        return false;
    }
    else {
        error_login_email.innerHTML="";
        login_btn.removeAttribute('disabled')
        login_btn.style.background='#219f45';
        return  true
    }
}

