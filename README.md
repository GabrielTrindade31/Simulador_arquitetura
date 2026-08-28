# CPU Lab — Simulador de Arquitetura

Simulador didático, construído em HTML, CSS e JavaScript puro, para experimentar máquinas de zero, um, dois e três endereços.

## Executar localmente

Abra `index.html` no navegador ou inicie um servidor local:

```bash
python3 -m http.server 8000
```

Depois, acesse <http://localhost:8000> no navegador.

## Testar no GitHub Codespaces

1. Abra o repositório no GitHub.
2. Clique em **Code** → **Codespaces** → **Create codespace on main**.
3. Quando o terminal do Codespace estiver pronto, execute:

   ```bash
   python3 -m http.server 8000
   ```

4. O Codespaces detectará a porta `8000`. Clique em **Open in Browser** na notificação que aparecer no canto inferior direito.

Se a notificação não aparecer, abra a aba **Ports** ao lado do terminal, localize a porta `8000` e clique no ícone de globo (**Open in Browser**). Mantenha o comando em execução enquanto usa o simulador.

Para encerrar o servidor, volte ao terminal e pressione <kbd>Ctrl</kbd> + <kbd>C</kbd>.
