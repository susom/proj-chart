Form = {
    ajaxURL: '',
    init: function (unique = null, zipcode = null) {
        $("#form").hide();

        // TODO - fix maybe, this was a rushjob
        Form.unique = unique ? unique : ["", "", "", "", "", "", "", ""];
        Form.zipcode = zipcode ? zipcode : ["", "", "", "", ""];
        Form.parseFromQs = unique && zipcode ? 1 : 0;

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

            if (type === 'newuniq' && (num === 2 || num === 3)) {
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
                        $('input[data-type="' + type + '"][data-num="' + (num - 1) + '"]').select().focus();
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

            if ((key >= 48 && key <= 57) || // normal numbers
                (key >= 96 && key <= 105) || // keypad
                (key >= 65 && key <= 90)     // ascii chars
                // removed (key >= 97 && key <= 122)
            ) {
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

            if (type === 'newuniq' && (num === 2 || num === 3)) {
                if (key >= 65 && key <= 90) {
                    // Allow alpha
                    return;
                }
            } else {
                if ((key >= 48 && key <= 57) || (key >= 96 && key <= 105)) {
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

        // Show the postcard
        $(".code_info").on('click', function () {
            $(".example_code").fadeIn("fast");

            //adjust for sc(reen width
            //TODO do this better , rush job
            var view_w = $(window).width();
            if (view_w < 716) {
                var new_w = view_w - 20;
                var new_ml = Math.round(new_w / 2) * -1;
                $("#example_img").css("width", new_w + "px").css("margin-left", new_ml + "px");
            } else {
                $("#example_img").css("width", "100%").css("margin-left", "-348px");
            }
        });

        $(".example_code").click(function () {
            $(this).fadeOut("medium");
        });

        // Autosubmit the first time if loading from a querystring
        if (Form.parseFromQs) $('#verify').click();
    },
    ajaxVerify: function (unique, zipcode) {
        $.ajax({
            url: Form.ajaxURL,
            data: {newuniq: unique, zipcode_abs: zipcode, parseFromQs: Form.parseFromQs},
            type: 'POST',
            success: function (response) {
                var data = JSON.parse(response);
                setCookie('login', data.cookie, 1)
                window.location.replace(data.link);
            },
            error: function (request, error) {
                var data = JSON.parse(request.responseText);
                //$('#verifyError>span').html('<p>' + data.message + '</p>').parent().show();
                $('#errors').html('<strong>' + data.message + '</strong>').parent().show()
            }
        });
    },
    inject: function () {
        var contest = '<div id="new-form" class="container">' +
            '            <div style="border: 0px !important;" class="alert alert-warning text-left alert-dismissable" role="alert">\n' +
            '                <h4 class="alert-heading"><i class="fas fa-exclamation-circle"></i>Please Note!</h4>\n' +
            '                <p>If you received a postcard with an erroneous ID number, please email <a href="mailto:signup@trackcovidbayarea.com">signup@trackcovidbayarea.com</a> including the mailing address where you received the postcard and we will email you back the correct ID. You can also call us at 415-348-2943. We apologize for the inconvenience. </p>\n' +
            '            </div>' +
            '<div class="alert alert-error text-center alert-dismissable collapse" role="alert" id="verifyError">' +
            ' <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
            ' <div id="errors" style="font-size: larger;"></div>' +
            '</div>' +
            '<section><h2 class="code_info">Enter your ID<br><span class="help_text">Where is my ID</span> <i class="far fa-question-circle"></i> </h2>' +
            '<div class="row row1">' +
            '<div class="col-1"><input data-num="1" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="' + Form.unique[0] + '"/></div>' +
            '<div class="col-1"><input data-num="2" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9a-zA-Z]{1}" value="' + Form.unique[1] + '"/></div>' +
            '<div class="col-1"><input data-num="3" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9a-zA-Z]{1}" value="' + Form.unique[2] + '"/></div>' +
            '<div class="col-1"><input data-num="4" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="' + Form.unique[3] + '"/></div>' +
            '<div class="col-1"><input data-num="5" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="' + Form.unique[4] + '"/></div>' +
            '<div class="col-1"><input data-num="6" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="' + Form.unique[5] + '"/></div>' +
            '<div class="col-1"><input data-num="7" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="' + Form.unique[6] + '"/></div>' +
            '<div class="col-1"><input data-num="8" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="' + Form.unique[7] + '"/></div>' +
            '</div></section>' +
            '<section><h2>Postal Code</h2>' +
            '<div class="row row2">' +
            '<div class="col-1"><input data-num="1" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" value="' + Form.zipcode[0] + '"/></div>' +
            '<div class="col-1"><input data-num="2" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" value="' + Form.zipcode[1] + '"/></div>' +
            '<div class="col-1"><input data-num="3" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" value="' + Form.zipcode[2] + '"/></div>' +
            '<div class="col-1"><input data-num="4" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" value="' + Form.zipcode[3] + '"/></div>' +
            '<div class="col-1"><input data-num="5" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" value="' + Form.zipcode[4] + '"/></div>' +
            '</div></section>' +
            '<section class="verify"><div class="row"><button id="verify" style="background-color: #007CBE;color: white !important;" type="button" class="btn btn-info btn-lg btn-block">Verify</button></div></section>' +
            '</div>';
        $("#pagecontent").after(contest);
        $("#new-form").show();
    }
}


