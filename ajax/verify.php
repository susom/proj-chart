<?php

namespace Stanford\ProjChart;

/** @var \Stanford\ProjChart\ProjChart $module */


try {
    if (!$module->parseFormInput()) {
        throw new \LogicException("not valid input");
    }
    $link = $module->formHandler();

    // when user finishes the survey they can redirected to user page in TrackCovid Appointment Scheduler without the need to login again
    $module->setUserCookie('login',
        $module->generateUniqueCodeHash(filter_var($_POST['newuniq'], FILTER_SANITIZE_STRING)));

    echo json_encode(array(
        'status' => 'success',
        'link' => $link,
        'cookie' => $module->generateUniqueCodeHash(filter_var($_POST['newuniq'], FILTER_SANITIZE_STRING)),
    ));
} catch (\LogicException $e) {
    $module->emError($e->getMessage());
    $module->notifyAdmins($e->getMessage());
    http_response_code(404);
    echo json_encode(array('status' => 'error', 'message' => $e->getMessage()));
} catch (\Exception $e) {
    $module->emError($e->getMessage());
    $module->notifyAdmins($e->getMessage());
    http_response_code(404);
    echo json_encode(array('status' => 'error', 'message' => $e->getMessage()));
}


