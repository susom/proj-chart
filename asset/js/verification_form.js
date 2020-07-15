Form = {
    ajaxURL: '',
    instrument: '',
    init: function () {
        $("#form").hide();
        Form.inject();

        var body = $('body');

        function goToNextInput(e) {
            var key = e.which,
                t = $(e.target),
                sib = t.next().find('.class');
            var type = t.data('type')
            var num = parseInt(t.data('num')) + 1
            var search = "input[data-type=" + type + "][data-num=" + num + "]"
            sib = $(search);

            //special case for second and third input

            // special case for delete
            if (key == 8) {
                t.val('')
                num = parseInt(t.data('num')) - 1
                search = "input[data-type=" + type + "][data-num=" + num + "]"
                sib = $(search);
                sib.select().focus();
                return false;
            }

            if (key != 9 && (key < 48)) {
                e.preventDefault();
                return false;
            }

            if (key === 9) {
                return true;
            }

            if (!sib || !sib.length) {
                sib = body.find('input').eq(0);
            }
            sib.select().focus();
        }

        function onKeyDown(e) {
            var key = e.which;

            if (key === 9 || (key >= 48 && key <= 57)) {
                return true;
            }

            e.preventDefault();
            return false;
        }

        function onFocus(e) {
            $(e.target).select();
        }

        $(document).on('keyup', 'input', function (e) {
            goToNextInput(e)
        });
        //
        // $(document).on('keydown', 'input', function (e) {
        //     goToNextInput(e)
        // });

        $(document).on('click', 'input', function (e) {
            goToNextInput(e)
        });

        $(document).on('click', '#verify', function () {
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
            data: {newuniq: unique, zipcode_abs: zipcode, instrument: Form.instrument},
            type: 'POST',
            success: function (response) {
                data = JSON.parse(response)
                window.location.replace(data.link);
            },
            error: function (request, error) {
                data = JSON.parse(request.responseText)
                alert(data.message);
            }
        });
    },
    inject: function () {
        var contest = '<div id="new-form" class="container">' +
            '<section ><h2>Unique Code (8 Characters)</h2>' +
            '<div class="row">' +
            '<div class="col-1"><input data-num="1" data-type="newuniq" class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="2" data-type="newuniq" class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" " /></div>' +
            '<div class="col-1"><input data-num="3" data-type="newuniq" class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5"   /></div>' +
            '<div class="col-1"><input data-num="4" data-type="newuniq" class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="5" data-type="newuniq" class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="6" data-type="newuniq" class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="7" data-type="newuniq" class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="8" data-type="newuniq" class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" pattern="[0-9]{1}" /></div>' +
            '</div></section>' +
            '<section><h2>Postal Code</h2>' +
            '<div class="row">' +
            '<div class="col-1"><input data-num="1" data-type="zipcode" class="zipcode overflow-auto form-control p-0 " type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}"/></div>' +
            '<div class="col-1"><input data-num="2" data-type="zipcode" class="zipcode overflow-auto form-control p-0 " type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="3" data-type="zipcode" class="zipcode overflow-auto form-control p-0 " type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="4" data-type="zipcode" class="zipcode overflow-auto form-control p-0 " type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '<div class="col-1"><input data-num="5" data-type="zipcode" class="zipcode overflow-auto form-control p-0 " type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '</div></section>' +
            '<section class="verify"><div class="row"><button id="verify" type="button" class="btn btn-info btn-lg btn-block">Verify</button></div></section>' +
            '</div>';
        $("#form").after(contest);
        $("#new-form").show();
    }
}

window.onload = function () {
    Form.init();
}
