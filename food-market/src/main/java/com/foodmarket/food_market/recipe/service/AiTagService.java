package com.foodmarket.food_market.recipe.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiTagService {

    private final ChatClient chatClient;

    public AiTagService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder
                .defaultSystem("You are a strict data-extraction bot for a Food Market application. Return ONLY valid JSON.")
                .build();
    }

    public record AiResult(List<String> tags) {}

    public AiResult analyzeRecipe(String recipeName, String ingredients) {
        log.info("Analyzing tags for recipe: {}", recipeName);

        // Converter này vẫn cần để lấy Schema và Parse JSON sau này
        var outputConverter = new BeanOutputConverter<>(AiResult.class);

        String promptText = """
            ### Instructions
            Analyze the input recipe and return a JSON object with a single key "tags".
            Select tags based strictly on the logic defined in the Context section.
            
            ### Context (Tagging Logic)
            1. ROLE (Choose exactly ONE best fit):
               - DISH_MAIN: Savory dishes eaten with rice (Thịt kho, Cá kho, Sườn xào, Tôm rim, Chả, Trứng chiên).
               - DISH_SOUP: Liquid dishes (Canh chua, Canh rau, Canh xương, Soup).
               - DISH_SIDE: Vegetable focused dishes (Rau xào, Rau luộc, Nộm/Salad, Dưa muối).
            
            2. COOKING TIME (Estimate based on method):
               - TIME_FAST: < 30 mins (Boil, Stir-fry, Salad, Fry).
               - TIME_MEDIUM: 30-60 mins (Steam, Roast, Basic soup).
               - TIME_SLOW: > 60 mins (Stew/Kho, Bone broth, Slow cook).    
            
            3. FLAVOR (Choose all that apply):
               - SPICY: Chili, Pepper, Satay.
               - SWEET: Sugar, Honey, Condensed milk, Sweet fruits.
               - SOUR: Tamarind, Vinegar, Lemon, Fermented rice (Mẻ), Tomato.
               - SAVORY: Fish sauce based, Braised dishes, Salty.
               - BITTER: Bitter melon (Mướp đắng).
            
            4. NUTRITION (Choose if applicable):
               - HIGH_PROTEIN: Meat/Fish/Eggs/Tofu is the main ingredient.
               - LOW_CARB: No sugar, no flour/breading.
               - LOW_FAT: Boiled/Steamed, Lean meat only.
               - HIGH_FIBER: Mostly vegetables.
            
            5. DIETARY (Choose if applicable):
               - VEGAN: No animal products at all.
               - VEGETARIAN: No meat/seafood (Eggs/Milk ok).
               - SEAFOOD: Contains shrimp, crab, fish, squid.
               - NUT: Contains peanuts, cashews, sesame.
            
            ### Input
            Recipe Name: {name}
            Ingredients: {ingredients}
            
            ### Example Output
            {{"tags":["HIGH_PROTEIN","SAVORY","SPICY"]}}
            """;

        try {
            PromptTemplate template = new PromptTemplate(promptText);
            String renderedText = template.render(Map.of(
                    "name", recipeName,
                    "ingredients", ingredients
            ));

            String finalContent = renderedText + "\n\n" + outputConverter.getFormat();

            Prompt prompt = new Prompt(new UserMessage(finalContent));

            String rawJsonParams = chatClient.prompt(prompt)
                    .call()
                    .content();

            log.info("AI Raw Response: {}", rawJsonParams);

            return outputConverter.convert(rawJsonParams);

        } catch (Exception e) {
            log.error("AI Tag Analysis failed: {}", e.getMessage());
            // Fallback
            return new AiResult(List.of());
        }
    }
}