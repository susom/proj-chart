Form = {
    ajaxURL: '',
    init: function (unique = null, zipcode = null) {
        $("#form").hide();

        // TODO - fix maybe, this was a rushjob
        Form.unique         = unique ? unique : ["","","","","","","",""];
        Form.zipcode        = zipcode ? zipcode : ["","","","",""];
        Form.parseFromQs    = unique && zipcode ? 1 : 0;

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

        $(".code_info").on('click', function(){ 
            $(".example_code").fadeIn("fast");
            
            //adjust for sc(reen width
            //TODO do this better , rush job 
            var view_w = $(window).width();
            if(view_w < 716){
                var new_w = view_w - 20;
                var new_ml = Math.round(new_w/2) * -1;
                $("#example_img").css("width", new_w+"px").css("margin-left", new_ml + "px");
            }else{
                $("#example_img").css("width", "100%").css("margin-left", "-348px");
            }
        });

        $(".example_code").click(function(){
            $(this).fadeOut("medium");
        });
    },
    ajaxVerify: function (unique, zipcode) {
        $.ajax({
            url: Form.ajaxURL,
            data: {newuniq: unique, zipcode_abs: zipcode, parseFromQs : Form.parseFromQs},
            type: 'POST',
            success: function (response) {
                var data = JSON.parse(response);
                setCookie('login', data.cookie, 1)
                window.location.replace(data.link);
            },
            error: function (request, error) {
                var data = JSON.parse(request.responseText);
                //$('#verifyError>span').html('<p>' + data.message + '</p>').parent().show();
                $('#errors').html('<strong>' + data.message + '</strong>').show()
            }
        });
    },
    inject: function () {
        var contest = '<div id="new-form" class="container">' +
            '<div class="alert alert-error text-center alert-dismissable collapse" role="alert" id="verifyError">' +
            ' <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
            ' <strong><span></span></strong>' +
            '</div>' +
            '<div id="errors" class="text-left alert alert-danger hidden"></div>' +
            '<section><h2>Enter your ID (8 Characters) <svg class="code_info" width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-patch-question" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM8.05 9.6c.336 0 .504-.24.554-.627.04-.534.198-.815.847-1.26.673-.475 1.049-1.09 1.049-1.986 0-1.325-.92-2.227-2.262-2.227-1.02 0-1.792.492-2.1 1.29A1.71 1.71 0 0 0 6 5.48c0 .393.203.64.545.64.272 0 .455-.147.564-.51.158-.592.525-.915 1.074-.915.61 0 1.03.446 1.03 1.084 0 .563-.208.885-.822 1.325-.619.433-.926.914-.926 1.64v.111c0 .428.208.745.585.745z"/><path fill-rule="evenodd" d="M10.273 2.513l-.921-.944.715-.698.622.637.89-.011a2.89 2.89 0 0 1 2.924 2.924l-.01.89.636.622a2.89 2.89 0 0 1 0 4.134l-.637.622.011.89a2.89 2.89 0 0 1-2.924 2.924l-.89-.01-.622.636a2.89 2.89 0 0 1-4.134 0l-.622-.637-.89.011a2.89 2.89 0 0 1-2.924-2.924l.01-.89-.636-.622a2.89 2.89 0 0 1 0-4.134l.637-.622-.011-.89a2.89 2.89 0 0 1 2.924-2.924l.89.01.622-.636a2.89 2.89 0 0 1 4.134 0l-.715.698a1.89 1.89 0 0 0-2.704 0l-.92.944-1.32-.016a1.89 1.89 0 0 0-1.911 1.912l.016 1.318-.944.921a1.89 1.89 0 0 0 0 2.704l.944.92-.016 1.32a1.89 1.89 0 0 0 1.912 1.911l1.318-.016.921.944a1.89 1.89 0 0 0 2.704 0l.92-.944 1.32.016a1.89 1.89 0 0 0 1.911-1.912l-.016-1.318.944-.921a1.89 1.89 0 0 0 0-2.704l-.944-.92.016-1.32a1.89 1.89 0 0 0-1.912-1.911l-1.318.016z"/></svg></h2>' +
            '<div class="row row1">' +
            '<div class="col-1"><input data-num="1" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="'+Form.unique[0]+'"/></div>' +
            '<div class="col-1"><input data-num="2" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9a-zA-Z]{1}" value="'+Form.unique[1]+'"/></div>' +
            '<div class="col-1"><input data-num="3" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9a-zA-Z]{1}" value="'+Form.unique[2]+'"/></div>' +
            '<div class="col-1"><input data-num="4" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="'+Form.unique[3]+'"/></div>' +
            '<div class="col-1"><input data-num="5" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="'+Form.unique[4]+'"/></div>' +
            '<div class="col-1"><input data-num="6" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="'+Form.unique[5]+'"/></div>' +
            '<div class="col-1"><input data-num="7" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="'+Form.unique[6]+'"/></div>' +
            '<div class="col-1"><input data-num="8" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" value="'+Form.unique[7]+'"/></div>' +
            '</div></section>' +
            '<section><h2>Postal Code</h2>' +
            '<div class="row row2">' +
            '<div class="col-1"><input data-num="1" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" value="'+Form.zipcode[0]+'"/></div>' +
            '<div class="col-1"><input data-num="2" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" value="'+Form.zipcode[1]+'"/></div>' +
            '<div class="col-1"><input data-num="3" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" value="'+Form.zipcode[2]+'"/></div>' +
            '<div class="col-1"><input data-num="4" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" value="'+Form.zipcode[3]+'"/></div>' +
            '<div class="col-1"><input data-num="5" data-type="zipcode" class="zipcode overflow-auto form-control p-0" type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" value="'+Form.zipcode[4]+'"/></div>' +
            '</div></section>' +
            '<section class="verify"><div class="row"><button id="verify" style="background-color: #007CBE;color: white !important;" type="button" class="btn btn-info btn-lg btn-block">Verify</button></div></section>' +
            '</div>';
        $("#pagecontent").after(contest);
        $("#new-form").show();
    }
}


