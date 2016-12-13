function init() {
    // loading animation
    $(document).ajaxStart(function() {
        $('#submit-bt').prop('disabled', 'disabled');
        $('#loading').show();
    }).ajaxStop(function() {
        if (!lastAccessDelay) $('#submit-bt').prop('disabled', '');
        $('#loading').hide();
    });
    // empty post for getting captcha and request_id
    doPost();
}


// 7707083893
function getInfo() {
    $('#result span, #error-text').text('');
    $('#result').hide();
    $('#error-text').hide();
    $('#tableWrapper').hide();
    if (!validateForm()) return;
    doPost();
}

// ajax to server and parse response
function doPost() {
    var payload = {
        "request_id": $('#request-id').val() * 1,
        "captcha": $('#captcha-text').val(),
        "inn": $('#inn').val()
    };
    $.ajax({
            url: 'http://statreg.gks.ru',
            type: "POST",
            data: JSON.stringify(payload),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        })
        .done(function(data) {
            if (!data.items) {
                $('#error-text').text("Сведений не найдено");
                $('#error-text').show();
            } else {
                $('#inn').val('');
                $('#tableWrapper').show();
                createTable(data.items);
                /*if (data.items.length === 1) {
                    var oranizationInfo = data.items[0];
                    $('#name-res').text(oranizationInfo.name);
                    $('#inn-res').text(oranizationInfo.inn);
                    $('#okpo-res').text(oranizationInfo.okpo);
                    $('#ogrn-res').text(oranizationInfo.ogrn);
                    $('#regdate-res').text(oranizationInfo.regdate);
                    $('#okfs-res').text(oranizationInfo.okfs);
                    $('#okfs-name-res').text(oranizationInfo.okfs_name);
                    $('#okogu-res').text(oranizationInfo.okogu);
                    $('#okogu-name-res').text(oranizationInfo.okogu_name);
                    $('#oktmo-res').text(oranizationInfo.oktmo);
                    $('#oktmo-name-res').text(oranizationInfo.oktmo_name);
                    $('#okato-res').text(oranizationInfo.okato);
                    $('#okato-name-res').text(oranizationInfo.okato_name);
                    $('#result').show();
                } else {
                    $('#tableWrapper').show();
                    createTable(data.items);
                }*/
            }
            var newCaptcha = data.request_id.captcha_img;
            var newRequestId = data.request_id.request_id;
            setNewParams(newCaptcha, newRequestId);
        })
        .fail(failedCallback)
        .always(() => {
            $('#captcha-text').val('');
            $('#captcha-text').focus();
        });
}

// data validation before ajax request
function validateForm() {
    var errorText = '';
    if (isNaN($('#inn').val())) errorText += 'ИНН должен содержать только цифры<br>';
    if (!($('#inn').val().length === 10 || $('#inn').val().length === 12)) errorText += 'ИНН должен быть 10 или 12 символов<br>';
    if ($('#captcha-text').val().length !== 5) errorText += 'Проверочный код должен быть 5 символов<br>';
    if (isNaN($('#captcha-text').val())) errorText += 'Проверочный код должен содержать только цифры<br>';
    if (errorText === '') return true;
    else {
        $('#error-text').html(errorText).show();
        return false;
    }
}

// 
function setNewParams(captcha, requestId) {
    captchaHeader = 'data:image/png;base64,';
    $('#request-id').val(requestId);
    $('#captcha-img').attr('src', captchaHeader + captcha);
}

var lastAccessDelay = 0; // flood protection on server (1 request per 30 sec)
var myTimer; // countdown for next ajax request
function failedCallback(error) {
    //console.log(error);
    if (error.responseJSON) {
        var errorText = error.responseJSON.error;
        // 1 request per 30 sec only
        if (error.status === 500 && error.responseJSON.lastAccessDelay) {
            $('#submit-bt').prop('disabled', 'disabled');
            lastAccessDelay = error.responseJSON.lastAccessDelay + 1;
            myTimer = setInterval(timeoutCallback, 1000);
            errorText = 'Следующий запрос можно отправить через ' + error.responseJSON.lastAccessDelay + ' сек.';
        }
        // empty request on app load
        if (error.status === 500 && error.responseJSON.error === 'no request_id') {
            errorText = '';
        }
        if (error.status === 0) {
            errorText = 'Нет доступа к сети. Проверьте подключение';
        }
        $('#error-text').text(errorText).show();
        var newCaptcha = error.responseJSON.request_id.captcha_img;
        var newRequestId = error.responseJSON.request_id.request_id;
        setNewParams(newCaptcha, newRequestId);
    } else {
        $('#error-text').text('Ошибка получения данных: ' + error.status + ' ' + error.statusText).show();
    }
}

function timeoutCallback() {
    lastAccessDelay--;
    if (!lastAccessDelay) {
        clearInterval(myTimer);
        $('#error-text').text('');
        $('#submit-bt').prop('disabled', '');
    } else {
        $('#error-text').text('Следующий запрос можно отправить через ' + lastAccessDelay + ' сек.');
    }
}

function createTable(items) {
    if (window.resultsTable.data != undefined) {
        window.resultsTable.destroy();
    }
    window.resultsTable = $('#resultsTable').DataTable({
        //scrollY: '70vh',
        scrollCollapse: false,
        paging: true,
        //stateSave: true,
        data: items,
        bLengthChange: false,
        iDisplayLength: 8,
        processing: true,
        columns: [
            //{"sTitle": '+', sDefaultContent: '', sClass: 'control'},
            {
                title: "Наименование",
                data: "name",
                class: 'name'
            }, {
                title: "ОКПО",
                data: 'okpo'
            }, {
                title: "ОГРН",
                data: 'ogrn'
            }, {
                title: "Дата регистрации",
                data: 'regdate'
            }, {
                title: "ОКФС код",
                data: 'okfs'
            }, {
                title: "ОКФС",
                data: 'okfs_name'
            }, {
                title: "ОКОГУ код",
                data: 'okogu'
            }, {
                title: "ОКОГУ",
                data: 'okogu_name'
            }, {
                title: "ОКТМО код",
                data: 'oktmo'
            }, {
                title: "ОКТМО",
                data: 'oktmo_name'
            }, {
                title: "ОКАТО код",
                data: 'okato'
            }, {
                title: "ОКАТО",
                data: 'okato_name'
            }
        ],
        stripeClasses: [],
        autoWidth: false,
        responsive: true
    });
}