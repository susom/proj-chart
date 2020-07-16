<?php

namespace Stanford\ProjChart;

/** @var \Stanford\ProjChart\ProjChart $module */


try {
    if (!$module->parseFormInput()) {
        throw new \LogicException("not valid input");
    }
    $link = $module->formHandler();
    echo json_encode(array('status' => 'success', 'link' => $link));
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


