Form = {
    ajaxURL: '',
    init: function () {
        $("#form").hide();
        Form.inject();

        $(document).on('click', '#verify', function () {
            var unique = ''
            var zipcode = ''
            $(".newuniq").each(function (index) {
                var val = $(this).val();
                if (val === '') {
                    alert('value is empty');
                    unique = false;
                    $(this).focus()
                    return unique;
                } else if (val.match(/^[a-zA-Z0-9]+/) === false) {
                    alert('code must be alphanumeric');
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
                        alert('value is empty');
                        zipcode = false;
                        $(this).focus()
                        return zipcode;
                    } else if (val.match(/^[0-9]+/) === false) {
                        alert('code must be numeric');
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
            data: {newuniq: unique, zipcode_abs: zipcode, redcap_csrf_token: Form.redcap_csrf_token},
            type: 'POST',
            success: function (data) {
                jQuery("#record-container").html(data);

                jQuery("#record-table").dataTable({
                    "paging": false,
                });
            },
            error: function (request, error) {
                alert("Request: " + JSON.stringify(request));
            }
        });
    },
    inject: function () {
        var contest = '<div id="new-form" class="container">' +
            '<div class="row col-12">' +
            '<div class="col-2">Postal Unique Code:</div>' +
            '<div class="col-1"><input class="newuniq overflow-auto form-control p-0" type="text" maxLength="1" size="5" " /></div>' +
            '<div class="col-1"><input class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" " /></div>' +
            '<div class="col-1"><input class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" " /></div>' +
            '<div class="col-1"><input class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" " /></div>' +
            '<div class="col-1"><input class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" " /></div>' +
            '<div class="col-1"><input class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" " /></div>' +
            '<div class="col-1"><input class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" " /></div>' +
            '<div class="col-1"><input class="newuniq overflow-auto form-control p-0 " type="text" maxLength="1" size="5" " /></div>' +
            '</div>' +
            '</div>' +
            '<div class="row col-12">' +
            '<div class="col-2">Postal Unique Code:</div>' +
            '<div class="col-2"><input class="zipcode overflow-auto form-control p-0 " type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}"/></div>' +
            '<div class="col-2"><input class="zipcode overflow-auto form-control p-0 " type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '<div class="col-2"><input class="zipcode overflow-auto form-control p-0 " type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '<div class="col-2"><input class="zipcode overflow-auto form-control p-0 " type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '<div class="col-2"><input class="zipcode overflow-auto form-control p-0 " type="text" maxLength="1" size="5" min="0" max="9" pattern="[0-9]{1}" /></div>' +
            '</div>' +
            '<div class="row offset-4"><button id="verify" type="button" class="btn btn-info">Verify</button></div>' +
            '</div>';
        $("#form").after(contest);
        $("#new-form").show();
    }
}

window.onload = function () {
    Form.init();
}