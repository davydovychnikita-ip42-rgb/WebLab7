<?php
error_reporting(0); 
date_default_timezone_set('Europe/Kiev'); 

header('Content-Type: application/json');

$dbFile = 'db.json';

$input = json_decode(file_get_contents('php://input'), true);
$method = $_SERVER['REQUEST_METHOD'];

$dataStore = [];
if (file_exists($dbFile)) {
    $jsonContent = file_get_contents($dbFile);
    if (!empty($jsonContent)) {
        $dataStore = json_decode($jsonContent, true);
        if (!$dataStore) $dataStore = [];
    }
}

if ($method === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'load') {
        echo json_encode($dataStore);
        exit;
    }
}

if ($method === 'POST' && $input) {
    $serverTime = date("Y-m-d\TH:i:s");
    
    if (isset($input['action'])) {
        if ($input['action'] === 'save_immediate' && isset($input['event'])) {
            $event = $input['event'];
            $found = false;
            foreach ($dataStore as &$row) {
                if ($row['id'] == $event['id']) {
                    $row['serverTime_Method1'] = $serverTime;
                    $row['message'] = $event['message'];
                    $row['clientTime'] = $event['clientTime'];
                    $found = true;
                    break;
                }
            }
            unset($row);
            if (!$found) {
                $dataStore[] = [
                    'id' => $event['id'],
                    'message' => $event['message'],
                    'clientTime' => $event['clientTime'],
                    'serverTime_Method1' => $serverTime,
                    'serverTime_Method2' => null
                ];
            }
        } 
        elseif ($input['action'] === 'save_batch' && isset($input['data'])) {
            $batchData = $input['data'];
            foreach ($batchData as $lsItem) {
                $found = false;
                foreach ($dataStore as &$row) {
                    if ($row['id'] == $lsItem['id']) {
                        $row['serverTime_Method2'] = $serverTime;
                        $found = true;
                        break;
                    }
                }
                unset($row);
                if (!$found) {
                    $dataStore[] = [
                        'id' => $lsItem['id'],
                        'message' => $lsItem['message'],
                        'clientTime' => $lsItem['clientTime'],
                        'serverTime_Method1' => null,
                        'serverTime_Method2' => $serverTime
                    ];
                }
            }
        }
    }

    file_put_contents($dbFile, json_encode($dataStore, JSON_PRETTY_PRINT));
    echo json_encode(['status' => 'success', 'serverTime' => $serverTime]);
    exit;
}
?>