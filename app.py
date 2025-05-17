import os
from flask import Flask, render_template, request, jsonify, url_for
from werkzeug.utils import secure_filename
import mysql.connector

app = Flask(__name__)

# teste concexão
def test_db_connection():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='PI-DRP03',
            database='cadastro_alunos'
        )
        print('Conexão com o banco de dados bem-sucedida!')
        conn.close()
    except Exception as e:
        print('Erro ao conectar ao banco de dados:', str(e))

test_db_connection()

#Salvar Fotos na pasta
UPLOAD_FOLDER = os.path.join('static', 'imagens', 'clientes')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Certifique-se de que a pasta existe
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Função para conectar banco de dados
def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',       # Substitua pelo seu usuário do MariaDB
        password='PI-DRP03',     # Substitua pela sua senha do MariaDB
        database='cadastro_alunos'
    )

# Rota principal para renderizar o formulário HTML
@app.route('/')
def index():

    return render_template('index.html')

# Rota para receber os dados do formulário e salvar no banco de dados
@app.route('/alunos', methods=['POST'])
def save_aluno():
    try:
        data = request.get_json(force=True)  # O 'force=True' ajuda caso o Flask não detecte JSON automaticamente
        
        # Validação dos dados recebidos
        required_fields = ["nome", "telefone", "sexo", "dataNascimento", "faixa", "grau", "plano"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Dados incompletos"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
            INSERT INTO alunos (nome, email, telefone, sexo, dataNascimento, faixa, grau, plano)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            data['nome'],
            data.get('email'),
            data['telefone'],
            data['sexo'],
            data['dataNascimento'],
            data['faixa'],
            data['grau'],
            data['plano']
        ))
        conn.commit()
        aluno_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Aluno salvo com sucesso!", "id": aluno_id}), 201
    except Exception as e:
        print("Erro ao salvar aluno:", str(e))
        return jsonify({"error": "Erro interno no servidor", "details": str(e)}), 500

        # Validação de campos obrigatórios
        required_fields = [nome, telefone, sexo, dataNascimento, faixa, grau, plano]
        if not all(required_fields):
            return jsonify({"error": "Todos os campos obrigatórios devem ser preenchidos"}), 400

        # Processa o upload da foto
        foto = request.files.get('foto')
        if foto and allowed_file(foto.filename):
            filename = secure_filename(foto.filename)
            foto_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            foto.save(foto_path)
            foto_url = url_for('static', filename=f'imagens/clientes/{filename}')
        else:
            foto_url = ''  # Se nenhuma foto foi enviada ou extensão inválida

        # Cria o dicionário de dados
        data = {
            'nome': nome,
            'email': email,
            'telefone': telefone,
            'sexo': sexo,
            'dataNascimento': dataNascimento,
            'faixa': faixa,
            'grau': grau,
            'plano': plano,
            'foto': foto_url
        }

        save_to_excel(data)
        return jsonify({"message": "Aluno salvo com sucesso!"}), 200
                
    except Exception as e:
        print("Dados do formulário:", request.form)
        print("Arquivos enviados:", request.files)
        print("Erro no backend:", str(e))
        return jsonify({"error": "Erro interno no servidor", "details": str(e)}), 500

# Rota para buscar alunos
@app.route('/alunos', methods=['GET'])
def get_alunos():
    try:
        nome = request.args.get('nome')
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        if nome and nome.strip() != '':
            sql = "SELECT * FROM alunos WHERE nome LIKE %s"
            params = (f"%{nome}%",)
        else:
            sql = "SELECT * FROM alunos"
            params = ()
        
        cursor.execute(sql, params)
        alunos = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({"data": alunos}), 200
    except Exception as e:
        print("Erro ao buscar alunos:", str(e))
        return jsonify({"error": "Erro interno no servidor", "details": str(e)}), 500

@app.route('/alunos/<int:id>', methods=['GET'])
def get_aluno(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM alunos WHERE id = %s", (id,))
        aluno = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if aluno:
            return jsonify({"data": aluno}), 200
        else:
            return jsonify({"error": "Aluno não encontrado"}), 404
    except Exception as e:
        print("Erro ao buscar aluno:", str(e))
        return jsonify({"error": "Erro interno no servidor", "details": str(e)}), 500

# Rota para deletar alunos

@app.route('/alunos/<int:id>', methods=['DELETE'])
def delete_aluno(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM alunos WHERE id = %s", (id,))
        conn.commit()
        rows_affected = cursor.rowcount
        cursor.close()
        conn.close()
        
        if rows_affected > 0:
            return jsonify({"message": "Aluno deletado com sucesso!"}), 200
        else:
            return jsonify({"error": "Aluno não encontrado"}), 404
    except Exception as e:
        print("Erro ao deletar aluno:", str(e))
        return jsonify({"error": "Erro interno no servidor", "details": str(e)}), 500
    
    # Rota para atualizar alunos

@app.route('/alunos/<int:id>', methods=['PUT'])
def update_aluno(id):
    try:
        data = request.get_json()
        print("Dados recebidos na atualização:", data)  # ✅ Verifica os dados no terminal
        
        if not data:
            return jsonify({"error": "Nenhum dado enviado"}), 400
        
        set_clause = ', '.join(f"{key} = %s" for key in data.keys())
        values = list(data.values())
        values.append(id)

        sql = f"UPDATE alunos SET {set_clause} WHERE id = %s"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql, values)
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Aluno atualizado com sucesso!"}), 200
    except Exception as e:
        print("Erro ao atualizar aluno:", str(e))  # ✅ Exibe detalhes no terminal
        return jsonify({"error": "Erro interno no servidor", "details": str(e)}), 500
        
        # Cria as partes da consulta dinamicamente
        set_clause = ', '.join(f"{key} = %s" for key in data.keys())
        values = list(data.values())
        values.append(id)  # Adiciona o ID no final dos valores
        
        sql = f"UPDATE alunos SET {set_clause} WHERE id = %s"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql, values)
        conn.commit()
        rows_affected = cursor.rowcount
        cursor.close()
        conn.close()
        
        if rows_affected > 0:
            return jsonify({"message": "Aluno atualizado com sucesso!"}), 200
        else:
            return jsonify({"error": "Aluno não encontrado"}), 404
    except Exception as e:
        print("Erro ao atualizar aluno:", str(e))
        return jsonify({"error": "Erro interno no servidor", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)