import os
from flask import Flask, render_template, request, jsonify
import mysql.connector

app = Flask(__name__)

# Configuração da conexão com o MariaDB
db_config = {
    'user': 'root',
    'password': 'PI-DRP03',
    'host': 'localhost',
    'database': 'cadastro_alunos'
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

# Rota principal para renderizar o formulário HTML
@app.route('/')
def index():
    return render_template('index.html')

# Rota para receber os dados do formulário e salvar no banco de dados
@app.route('/alunos', methods=['POST'])
def save_aluno():
    try:
        data = request.get_json()
        
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
        
        if not data:
            return jsonify({"error": "Nenhum dado enviado"}), 400
        
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
