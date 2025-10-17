$.validator.addMethod('validPassword', function (value, element) {
    if (value !== '') {
        if (value.match(/.*[a-z]+.*/i) == null) return false;
        if (value.match(/.*\d+.*/i) == null) return false;
    }
    return true;
}, '<div class="text-danger" style="color: red; padding-top: 10px;">Password must contain at least one letter and one number.</div>');