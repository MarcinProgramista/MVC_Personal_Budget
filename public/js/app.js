$.validator.addMethod('validPassword', function (value, element) {
    if (value !== '') {
        if (!/[a-z]/i.test(value)) return false;
        if (!/\d/.test(value)) return false;
    }
    return true;
}, '<div style="color: red; padding-top: 10px;">Password must contain at least one letter and one number.</div>');
