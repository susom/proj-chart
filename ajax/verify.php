<?php

namespace Stanford\ProjChart;

/** @var \Stanford\ProjChart\ProjChart $module */

try {
    $module->parseFormInput();
    $module->formHandler();
} catch (\LogicException $e) {
    http_response_code(404);
    echo json_encode(array('status' => 'error', 'message' => $e->getMessage()));
} catch (\Exception $e) {
    http_response_code(404);
    echo json_encode(array('status' => 'error', 'message' => $e->getMessage()));
}


