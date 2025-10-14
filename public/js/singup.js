// Custom validator for password
$.validator.addMethod('validPassowrd', function(value, element) {
  if (value !== '') {
    if (value.match(/.*[a-z]+.*/i) == null) return false;
    if (value.match(/.*\d+.*/i) == null) return false;
  }
  return true;
}, '<div style="color: red; padding-top: 10px;">Password must contain at least one letter and one number.</div>');

$(document).ready(function(){

  // Form validation
  $("#formSignup").validate({
    rules: {
      name: "required",
      email: {
        required: true,
        email: true,
        remote: '/account/validate-email'
      },
      password: {
        required: true,
        minlength: 6,
        validPassowrd: true
      }
    },
    messages: {
      email: {
        required: '<div style="color: red; padding-top: 10px;">Email is required</div>',
        remote: '<div style="color: red; padding-top: 10px;">Email is already taken</div>'
      },
      name: {
        required: '<div style="color: red; padding-top: 10px;">Name is required</div>'
      },
      password: {
        required: '<div style="color: red;">Password is required</div>',
        minlength: '<div style="color: red;">Password must have at least 6 characters</div>'
      }
    }
  });

  // Show/hide password plugin
  $('#inputPassword').hideShowPassword({
    show: false,
    innerToggle: true,
    toggle: {
      className: 'btn btn-sm btn-dark hide-password-btn hideShowPassword-toggle',
      content: '<i class="fa fa-eye"></i>',
      attr: {
        'aria-label': 'Show password',
        title: 'Show password'
      }
    },
    states: {
      shown: { toggle: { content: '<i class="fa fa-eye-slash"></i>', attr: { title: 'Hide password' } } },
      hidden: { toggle: { content: '<i class="fa fa-eye"></i>', attr: { title: 'Show password' } } }
    }
  });

});
