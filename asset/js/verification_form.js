Form = {
    ajaxURL: '',
    init: function () {
        $("#form").hide();
        Form.inject();

        var body = $('body');

        // Auto-advance to the next input
        function goToNextInput(e) {
            var key = e.which;
            var t = $(e.target);
            var type = t.data('type');
            var num = parseInt(t.data('num'));
            var search = "input[data-type=" + type + "][data-num=" + (num + 1) + "]";
            var sib = $(search);

            if (type === 'newuniq' && ( num === 2 || num === 3)) {
                if (key >= 48 && key <= 57) {
                    // Skip numbers
                    key == 8;
                }

                // Uppercase
                t.val(t.val().toUpperCase());
            }

            // Delete
            if (key == 8) {
                if (t.val() !== '') {
                    // Clear the current value if present
                    t.val('');
                } else {
                    // Goto the previous input and clear it
                    if (num === 1) {
                        if (type === 'zipcode') {
                            // Go back to last from previous section
                            $('input[data-type="newuniq"]').last().select().focus();
                        } else {
                            // Can't go back
                        }
                    } else {
                        $('input[data-type="'+type+'"][data-num="'+(num-1)+'"]').select().focus();
                    }
                }
                e.preventDefault();
                return false;
            }

            // Let tabs work like normal...
            if (key === 9) {
                return true;
            }

            // if it is empty, don't move forward
            if (t.val() === '') {
                e.preventDefault();
                return false;
            }

            if ((key >= 48 && key <= 57) ||
                (key >= 65 && key <= 90) ||
                (key >= 97 && key <= 122)) {
                // Find the next input if no siblings
                if (!sib || !sib.length) {
                    var tabindex = t.attr('tabindex');
                    tabindex++; //increment tabindex
                    sib = $('[tabindex=' + tabindex + ']'); //.focus();

                    // if (type === 'newuniq' && num === 8) {
                    //     sib = $('input[data-type="zipcode"][data-num="1"]');
                    // }
                }
                sib.select().focus();
            } else {
                e.preventDefault();
                return false;
            }
        }


        // Filter valid keys
        function onKeyDown(e) {
            var key = e.which;
            var t = $(e.target);
            var type = t.data('type');
            var num = parseInt(t.data('num'));

            // Tab or delete or number are allowed
            if (key === 9 || key === 8) {
                // Allow tab and delete
                return;
            }

            if (type === 'newuniq' && ( num === 2 || num === 3)) {
                if (key >= 65 && key <= 90) {
                    // Allow alpha
                    return;
                }
            } else {
                if (key >= 48 && key <= 57) {
                    // Allow numbers
                    return;
                }
            }

            // Reject
            e.preventDefault();
            return false;
        }

        function onFocus(e) {
            $(e.target).select();
        }

        $(body).on('keyup', 'input', function (e) {
            e = e || window.event;
            goToNextInput(e);
        });

        $(body).on('keydown', 'input', function (e) {
            e = e || window.event;
            onKeyDown(e);
        });

        $(body).on('click', 'input', function (e) {
            onFocus(e)
        });

        $(body).on('click', '#verify', function () {
            var unique = ''
            var zipcode = ''
            $(".newuniq").each(function (index) {
                var val = $(this).val();
                if (val === '') {
                    alert('code cant be empty');
                    unique = false;
                    $(this).focus()
                    return unique;
                    //second and third char of the code should be alphabet
                } else if (val.match(/^[a-zA-Z]+/) === null && (index === 1 || index === 2)) {
                    alert('code must be alphabet');
                    unique = false;
                    $(this).focus()
                    return unique;
                } else if (val.match(/^[0-9]+/) === null && index !== 1 && index !== 2) {
                    alert('code must be numeric');
                    unique = false;
                    $(this).focus()
                    return unique;
                } else {
                    unique += val;
                }

            });
            // if we got all unique code values
            if (unique !== false) {
                $(".zipcode").each(function (index) {
                    var val = $(this).val();
                    if (val === '') {
                        alert('please complete the zipcode');
                        zipcode = false;
                        $(this).focus()
                        return zipcode;
                    } else if (val.match(/^[0-9]+/) === false) {
                        alert('zipcode has to be a number');
                        zipcode = false;
                        $(this).focus()
                        return zipcode;
                    } else {
                        zipcode += val;
                    }

                });
            }

            if (unique !== false && zipcode !== false) {
                Form.ajaxVerify(unique, zipcode)
            }
        })
    },
    ajaxVerify: function (unique, zipcode) {
        $.ajax({
            url: Form.ajaxURL,
            data: {newuniq: unique, zipcode_abs: zipcode},
            type: 'POST',
            success: function (response) {
                var data = JSON.parse(response);
                window.location.replace(data.link);
            },
            error: function (request, error) {
                var data = JSON.parse(request.responseText);
                //$('#verifyError>span').html('<p>' + data.message + '</p>').parent().show();
                alert(data.message);
            }
        });
    },
    inject: function () {
        var contest = '<div id="new-form" class="container">' +
            '<div class="alert alert-error text-center alert-dismissable collapse" role="alert" id="verifyError">' +
            ' <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
            ' <strong><span></span></strong>' +
            '</div>' +
            '<section><h2>Unique Code (8 Characters)</h2>' +
            '<div class="row row1">' +
            '<div class="col-1"><input data-num="1" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="2" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9a-zA-Z]{1}" /></div>' +
            '<div class="col-1"><input data-num="3" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9a-zA-Z]{1}" /></div>' +
            '<div class="col-1"><input data-num="4" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="5" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="6" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="7" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="8" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '</div></section>' +
            '<section><h2>Postal Code</h2>' +
            '<div class="row row2">' +
            '<div class="col-1"><input data-num="1" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}"/></div>' +
            '<div class="col-1"><input data-num="2" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="3" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="4" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="5" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '</div></section>' +
            '<section class="verify"><div class="row"><button id="verify" style="background-color: #007CBE" type="button" class="btn btn-info btn-lg btn-block">Verify</button></div></section>' +
            '</div>';
        $("#pagecontent").after(contest);
        $("#new-form").show();
    }
}

window.onload = function () {
    Form.init();
}
