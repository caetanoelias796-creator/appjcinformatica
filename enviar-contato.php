<?php
// Define o tipo de resposta como JSON em UTF-8
header('Content-Type: application/json; charset=utf-8');

// Permite apenas requisições POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'message' => 'Método não permitido.'));
    exit;
}

// Obtém o payload JSON enviado pelo JavaScript
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Dados inválidos.'));
    exit;
}

// Extrai e sanitiza os dados recebidos (Compatível com PHP 5.6)
$nome     = filter_var(isset($data['nome']) ? $data['nome'] : '', FILTER_SANITIZE_SPECIAL_CHARS);
$email    = filter_var(isset($data['email']) ? $data['email'] : '', FILTER_VALIDATE_EMAIL);
$telefone = filter_var(isset($data['telefone']) ? $data['telefone'] : '', FILTER_SANITIZE_SPECIAL_CHARS);
$servico  = filter_var(isset($data['servico']) ? $data['servico'] : '', FILTER_SANITIZE_SPECIAL_CHARS);
$mensagem = filter_var(isset($data['mensagem']) ? $data['mensagem'] : '', FILTER_SANITIZE_SPECIAL_CHARS);

// Validação dos campos obrigatórios
if (empty($nome) || !$email || empty($mensagem)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Por favor, preencha todos os campos obrigatórios.'));
    exit;
}

// Configurações do e-mail
$to      = 'contato@jcinformatica.net.br'; // Destinatário
$from    = 'contato@jcinformatica.net.br'; // Remetente (Obrigatório ser do domínio na Locaweb)
$subject = 'Novo contato do site - JC Informática';

// Conteúdo em HTML formatado
$body = "
<html>
<head>
  <title>Contato do Site</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
  <h2 style='color: #0037FF;'>Novo contato recebido pelo formulário do site</h2>
  <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
  <p><strong>Nome:</strong> {$nome}</p>
  <p><strong>E-mail:</strong> {$email}</p>
  <p><strong>Telefone:</strong> " . ($telefone ? $telefone : 'Não informado') . "</p>
  <p><strong>Tipo de Serviço:</strong> " . ($servico ? ucfirst($servico) : 'Não informado') . "</p>
  <p style='margin-top: 15px;'><strong>Mensagem:</strong></p>
  <div style='background: #f9f9f9; padding: 15px; border-left: 4px solid #0037FF; border-radius: 4px;'>
    " . nl2br($mensagem) . "
  </div>
</body>
</html>
";

// Cabeçalhos (Headers) para e-mail HTML e reply-to (Compatível com PHP 5.6 usando array())
$headers = array();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/html; charset=utf-8';
$headers[] = 'From: JC Informática <' . $from . '>';
$headers[] = 'Return-Path: ' . $from;
$headers[] = 'Reply-To: ' . $nome . ' <' . $email . '>'; // Permite responder diretamente ao cliente
$headers[] = 'X-Mailer: PHP/' . phpversion();

// Envia o e-mail usando o parâmetro -r exigido pela Locaweb (usando \n para quebras de cabeçalho no Linux/Postfix)
if (mail($to, $subject, $body, implode("\n", $headers), "-r" . $from)) {
    echo json_encode(array('success' => true, 'message' => 'Mensagem enviada com sucesso!'));
} else {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Erro ao processar o envio da mensagem. Tente novamente mais tarde.'));
}
