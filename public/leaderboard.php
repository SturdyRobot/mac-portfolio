<?php
/* ═══════════════════════════════════════════════════════════════════
   ARCADE LEADERBOARD — tiny shared high-score API (global, for everyone)
   Runs on Hostinger's PHP. Scores live in one JSON file on the server,
   so every visitor sees the same board.

     GET  /leaderboard.php?game=jungle        -> top 10 for that game
     GET  /leaderboard.php                     -> all games' top 10
     POST /leaderboard.php  {game,tag,score}   -> submit, returns top 10

   Storage: leaderboard-data.json next to this file (locked on write).
   ═══════════════════════════════════════════════════════════════════ */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const GAMES = ['jungle', 'snake', 'breakout'];
const MAX   = 10;
const SCORE_CAP = 9999999;
$dataFile = __DIR__ . '/leaderboard-data.json';

function read_all($file) {
  if (!file_exists($file)) return [];
  $j = json_decode(@file_get_contents($file), true);
  return is_array($j) ? $j : [];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $all = read_all($dataFile);
  $game = isset($_GET['game']) ? $_GET['game'] : '';
  if ($game !== '') {
    echo json_encode(array_slice($all[$game] ?? [], 0, MAX));
  } else {
    $out = [];
    foreach (GAMES as $g) $out[$g] = array_slice($all[$g] ?? [], 0, MAX);
    echo json_encode($out);
  }
  exit;
}

if ($method === 'POST') {
  $body  = json_decode(file_get_contents('php://input'), true);
  $game  = is_array($body) && isset($body['game'])  ? $body['game']  : '';
  $rawTag= is_array($body) && isset($body['tag'])   ? $body['tag']   : '';
  $score = is_array($body) && isset($body['score']) ? intval($body['score']) : 0;

  $tag = strtoupper(preg_replace('/[^A-Za-z0-9 ]/', '', (string)$rawTag));
  $tag = trim(substr($tag, 0, 6));

  if (!in_array($game, GAMES, true) || $tag === '' || $score <= 0 || $score > SCORE_CAP) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid']);
    exit;
  }

  $fp = fopen($dataFile, 'c+');
  if (!$fp) { http_response_code(500); echo json_encode(['error' => 'store']); exit; }
  flock($fp, LOCK_EX);
  $raw = stream_get_contents($fp);
  $all = json_decode($raw, true);
  if (!is_array($all)) $all = [];

  $board = isset($all[$game]) && is_array($all[$game]) ? $all[$game] : [];
  $board[] = ['tag' => $tag, 'score' => $score, 't' => time()];
  usort($board, function ($a, $b) { return $b['score'] - $a['score']; });
  $board = array_slice($board, 0, MAX);
  $all[$game] = $board;

  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, json_encode($all));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);

  echo json_encode($board);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'method']);
