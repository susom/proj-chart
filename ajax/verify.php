<?php

namespace Stanford\ProjChart;

/** @var \Stanford\ProjChart\ProjChart $module */

try {
    if (!$module->parseFormInput()) {
        throw new \LogicException("not valid input");
    }
    if ($module->formHandler()) {
        echo json_encode(array('status' => 'success', 'message' => 'data saved'));
    }
} catch (\LogicException $e) {
    http_response_code(404);
    echo json_encode(array('status' => 'error', 'message' => $e->getMessage()));
} catch (\Exception $e) {
    http_response_code(404);
    echo json_encode(array('status' => 'error', 'message' => $e->getMessage()));
}


