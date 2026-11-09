package com.example.a9rd20261102

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)
    }

    fun onResultClick(view: View) {
        findViewById<TextView>(R.id.resultText).text = """
            성명 - ${input(R.id.editName)}
            비밀번호 - ${input(R.id.editPassword)}
            이메일 - ${input(R.id.editEmail)}
            생년월일 - ${input(R.id.editBirth)}
            연락처 - ${input(R.id.editPhone)}
        """.trimIndent()

        startActivity(Intent(this, AnimalActivity::class.java))  // 동물 사진 화면으로 이동
    }

    private fun input(id: Int) = findViewById<EditText>(id).text
}
